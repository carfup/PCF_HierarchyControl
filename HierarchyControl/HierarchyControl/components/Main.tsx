import { useState, useEffect } from "react";
import * as React from "react";
import OrgChartComponent from "./OrgChartComponent";
import { fieldDefinition, Mapping } from "../EntitiesDefinition";
import { Button, Input } from "@fluentui/react-components";
import {
  ZoomInRegular,
  ZoomOutRegular,
  SearchRegular,
  PageFitRegular,
} from "@fluentui/react-icons";

const App = (props: any) => {
  const [data, setData] = useState(null);
  const [jsonMappingControl, setJsonMappingControl] = useState(null);
  const jsonMapping = JSON.parse(props.jsonMapping);
  const contextInfo = props.context.mode.contextInfo;
  jsonMapping.entityName = contextInfo.entityTypeName;

  const fields: fieldDefinition[] = extractFields(jsonMapping);
  let clickZoom: any = null;
  let searchNode: any = null;

  useEffect(() => {
    const getAllData = async () => {
      // Get attributes details
      let dataEM = await props.context.utils.getEntityMetadata(
        jsonMapping.entityName,
        fields.map((u: fieldDefinition) => u.name)
      );

      // Check if PCF is configured to retrieve data from a lookup record instead of the main record
      // in case of external, get the EntityMetadata of the lookup record
      dataEM = await isExternalLookup(dataEM, jsonMapping);

      // retrive attributes details and formatting
      getAttributeDetails(dataEM);

      const getTopParentData =
        await props.context.webAPI.retrieveMultipleRecords(
          jsonMapping.entityName,
          `?$filter=Microsoft.Dynamics.CRM.Above(PropertyName='${jsonMapping.recordIdField}',PropertyValue='${jsonMapping.recordIdValue}') and _${jsonMapping.parentField}_value eq null`
        );

      // Get to parent to retrieve all records below it
      const getTopParentDataId =
        getTopParentData.entities.length == 0
          ? jsonMapping.recordIdValue
          : getTopParentData.entities[0][jsonMapping.recordIdField];

      // get all records below the top parent
      const concatFields = fields
        .filter((f: fieldDefinition) => f.webapiName)
        .map((f: fieldDefinition) => f.webapiName)
        .join(",");
      const getChildrenData =
        await props.context.webAPI.retrieveMultipleRecords(
          jsonMapping.entityName,
          `?$filter=Microsoft.Dynamics.CRM.UnderOrEqual(PropertyName='${jsonMapping.recordIdField}',PropertyValue='${getTopParentDataId}')&$select=${concatFields}`
        );

      // format the data
      const jsonData: any = formatJson(
        getChildrenData.entities,
        fields,
        jsonMapping
      );

      // Update the mapping passed to the OrgChartComponent
      setJsonMappingControl(jsonMapping);
      // set the data
      setData(jsonData);
    };

    getAllData();
  }, [true]);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        {jsonMapping.properties?.showZoom && (
          <div id="carfup_HierarchyControl_zoom">
            <Button
              icon={<ZoomInRegular />}
              onClick={() => zoom("in")}
              title="Zoom In"
            />
            &nbsp;
            <Button
              icon={<ZoomOutRegular />}
              onClick={() => zoom("out")}
              title="Zoom Out"
            />
            &nbsp;
            <Button
              icon={<PageFitRegular />}
              onClick={() => zoom("fit")}
              title="Fit to screen"
            />
            &nbsp;
          </div>
        )}
        {jsonMapping.properties?.showSearch && (
          <Input
            contentAfter={<SearchRegular />}
            placeholder="Search"
            onChange={(e: any) => search(e.target.value)}
          />
        )}
      </div>
      <div
        id="carfup_HierarchyControl"
        style={{
          width:
            jsonMapping.properties?.width ??
            props.context.mode.allocatedWidth + "px",
          height:
            jsonMapping.properties?.height ??
            props.context.mode.allocatedHeight + "px",
        }}
      >
        <OrgChartComponent
          data={data}
          mapping={jsonMappingControl}
          setZoom={(z: any) => (clickZoom = z)}
          setSearch={(s: any) => (searchNode = s)}
          context={props.context}
          size={{
            width: jsonMapping.properties?.width ??
            props.context.mode.allocatedWidth,
            height: jsonMapping.properties?.height ??
            props.context.mode.allocatedHeight}}
        />
      </div>
    </div>
  );

  function zoom(zoom: string = "in") {
    clickZoom(zoom);
  }

  function search(value: string) {
    searchNode(value);
  }

  function renameKey(
    obj: any,
    oldKey: string,
    newKey: string,
    targetJson: any
  ) {
    if (oldKey) {
      if (["id", "parentId"].includes(newKey)) {
        targetJson[newKey] = obj[oldKey];
      } else {
        // Getting formatted value for Lookups
        let key = oldKey;
        const type: string | undefined = fields.find(
          (f: any) => f.webapiName === oldKey
        )?.type;
        if (type && ["lookup", "datetime", "picklist"].includes(type)) {
          key = `${oldKey}@OData.Community.Display.V1.FormattedValue`;
        }

        targetJson[newKey] = {
          value: getValue(obj[key], type),
          type: type,
          displayName: fields.find((f: any) => f.webapiName === oldKey)
            ?.displayName,
        };
      }
    }
  }

  function getValue(value: any, type: string | undefined) {
    let result = value;
    switch (type) {
      case "date":
        result = props.context.formatting.formatDateShort(new Date(value));
        break;
      case "money":
        result = props.context.formatting.formatCurrency(value);
        break;
    }

    return result == undefined ? null : result;
  }

  function getAttributeDetails(em: any) {
    em.Attributes.forEach((attr: any) => {
      const index = fields.findIndex((f: any) => f.name === attr.LogicalName);
      fields[index].webapiName =
        em.PrimaryAttributeId != attr.LogicalName &&
        (attr.AttributeTypeName == "lookup" ||
          attr.AttributeTypeName == "owner" ||
          attr.AttributeTypeName == "customer")
          ? `_${attr.LogicalName}_value`
          : attr.LogicalName;
      fields[index].type = returnType(attr);
      fields[index].displayName = attr.DisplayName;
    });
  }

  function formatJson(jsonData: any, fields: any, mapping: any) {
    const targetJson: any[] = [];
    jsonData.forEach((obj: any) => {
      const propsTarget: any = {};
      renameKey(obj, isLookup(mapping.recordIdField), "id", propsTarget);
      renameKey(obj, isLookup(mapping.parentField), "parentId", propsTarget);
      renameKey(obj, isLookup(mapping.mapping.name), "name", propsTarget);
      if (mapping.mapping.attribute1) {
        renameKey(
          obj,
          isLookup(mapping.mapping.attribute1),
          "attribute1",
          propsTarget
        );
      }
      if (mapping.mapping.attribute2) {
        renameKey(
          obj,
          isLookup(mapping.mapping.attribute2),
          "attribute2",
          propsTarget
        );
      }
      if (mapping.mapping.attribute3) {
        renameKey(
          obj,
          isLookup(mapping.mapping.attribute3),
          "attribute3",
          propsTarget
        );
      }
      targetJson.push(propsTarget);
    });
    return targetJson;
  }

  function extractFields(jsonMapping: Mapping): fieldDefinition[] {
    const fields: fieldDefinition[] = [];
    fields.push({ name: jsonMapping.recordIdField });
    fields.push({ name: jsonMapping.parentField });
    fields.push({ name: jsonMapping.mapping.name });
    if (jsonMapping.mapping.attribute1)
      fields.push({ name: jsonMapping.mapping.attribute1 });
    if (jsonMapping.mapping.attribute2)
      fields.push({ name: jsonMapping.mapping.attribute2 });
    if (jsonMapping.mapping.attribute3)
      fields.push({ name: jsonMapping.mapping.attribute3 });

    if (jsonMapping.lookupOtherTable) {
      fields.push({ name: jsonMapping.lookupOtherTable });
    }
    return fields;
  }

  function isLookup(field: string) {
    const f = fields.find((f: any) => f.name === field)?.type;
    return f === "lookup" ? `_${field}_value` : field;
  }

  function returnType(attr: any) {
    let result = attr.AttributeTypeName;
    switch (attr.AttributeTypeName) {
      case "owner":
      case "partylist":
      case "customer":
      case "lookup":
        result = "lookup";
        break;
      case "decimal":
      case "double":
      case "integer":
      case "int":
      case "bigint":
        result = "number";
        break;
      case "string":
        switch (attr.attributeDescriptor.FormatName) {
          case "Url":
            result = "url";
            break;
          case "Phone":
            result = "phone";
            break;
        }
        break;
    }
    return result;
  }

  // Check if the PCF is configured to retrieve data from a lookup record instead of the main record
  async function isExternalLookup(dataEM: any, jsonMapping: Mapping) {
    const contextInfo = props.context.mode.contextInfo;
    let lookupTableDetails = dataEM;
    if (jsonMapping.lookupOtherTable) {
      const lookupField =
        dataEM.Attributes._collection[jsonMapping.lookupOtherTable];

      lookupTableDetails = await props.context.utils.getEntityMetadata(
        lookupField.Targets[0],
        fields.map((u: any) => u.name)
      );
      const lookupFieldValue = await props.context.webAPI.retrieveRecord(
        jsonMapping.entityName,
        contextInfo.entityId,
        `?$select=_${jsonMapping.lookupOtherTable}_value`
      );

      jsonMapping.entityName = lookupTableDetails.LogicalName;
      jsonMapping.recordIdField = lookupTableDetails.PrimaryIdAttribute;
      jsonMapping.recordIdValue =
        lookupFieldValue[`_${jsonMapping.lookupOtherTable}_value`];
    } else {
      jsonMapping.recordIdValue = contextInfo.entityId;
    }

    return lookupTableDetails;
  }
};

export default App;
