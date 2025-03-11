import { useState, useEffect } from "react";
import * as React from "react";
import OrgChartComponent from "./OrgChartComponent";
import { Mapping } from "../EntitiesDefinition";
import { DataFormatter } from "../DataFormatter";
import { Button, Input } from "@fluentui/react-components";
import {
  ZoomInRegular,
  ZoomOutRegular,
  SearchRegular,
} from "@fluentui/react-icons";

const App = (props: any) => {
  const [data, setData] = useState(null);
  const [jsonMappingControl, setJsonMappingControl] = useState(null);
  let jsonMapping = JSON.parse(props.jsonMapping);
  const contextInfo = props.context.mode.contextInfo;
  jsonMapping.entityName = contextInfo.entityTypeName;

  const fields = DataFormatter.extractFields(jsonMapping);
  let primaryIdAttribute = "";
  let clickZoom: any = null;
  let searchNode: any = null;

  useEffect(() => {
    const getAllData = async () => {
      jsonMapping.recordIdValue = "12234";
      // Get attributes details
      const dataEM = await props.context.utils.getEntityMetadata(
        jsonMapping.entityName,
        fields.map((u) => u.name)
      );

      // retrive attributes details and formatting
      primaryIdAttribute = dataEM.PrimaryIdAttribute;
      getAttributeDetails(dataEM);

      // Check if PCF is configured to retrieve data from a lookup record instead of the main record
      await isExternalLookup(dataEM, jsonMapping);

      const getTopParentData =
        await props.context.webAPI.retrieveMultipleRecords(
          jsonMapping.entityName,
          `?$filter=
            Microsoft.Dynamics.CRM.Above(PropertyName='${jsonMapping.recordIdField}',PropertyValue='${jsonMapping.recordIdValue}') and _${jsonMapping.parentField}_value eq null
          `
        );

      // Get to parent to retrieve all records below it
      const getTopParentDataId =
        getTopParentData.entities.length == 0
          ? jsonMapping.recordIdValue
          : getTopParentData.entities[0][jsonMapping.recordIdField];

      // get all records below the top parent
      const getChildrenData =
        await props.context.webAPI.retrieveMultipleRecords(
          jsonMapping.entityName,
          `?$filter=
          Microsoft.Dynamics.CRM.UnderOrEqual(PropertyName='${
            jsonMapping.recordIdField
          }',PropertyValue='${getTopParentDataId}') 
          &$select=${fields.map((f) => f.webapiName).join(",")}
        `
        );

      // format the data
      const jsonData = formatJson(getChildrenData.entities, jsonMapping);

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
        {jsonMapping.properties?.showZoom! && (
          <div id="carfup_HierarchyControl_zoom">
            <Button icon={<ZoomInRegular />} onClick={() => zoom("in")} />
            &nbsp;
            <Button icon={<ZoomOutRegular />} onClick={() => zoom("out")} />
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
        if (["lookup", "datetime", "picklist"].includes(type!)) {
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
        attr.AttributeTypeName == "lookup" ||
        attr.AttributeTypeName == "owner" ||
        attr.AttributeTypeName == "customer"
          ? `_${attr.LogicalName}_value`
          : attr.LogicalName;
      fields[index].type = returnType(attr);
      fields[index].displayName = attr.DisplayName;
    });
  }

  function formatJson(jsonData: any, jsonMapping: Mapping): any {
    return DataFormatter.formatJson(
      jsonData,
      fields,
      jsonMapping,
      renameKey,
      isLookup
    );
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

    if (jsonMapping.lookupOtherTable) {
      const lookupField =
        dataEM.Attributes._collection[jsonMapping.lookupOtherTable];

      const lookupTableDetails = await props.context.utils.getEntityMetadata(
        lookupField.EntityLogicalName
      );
      const lookupFieldValue = await props.context.webAPI.retrieveRecord(
        jsonMapping.entityName,
        contextInfo.entityId,
        `?$select=_${jsonMapping.lookupOtherTable}_value`
      );

      jsonMapping.entityName = lookupField.EntityLogicalName;
      jsonMapping.recordIdField = lookupTableDetails.PrimaryIdAttribute;
      jsonMapping.recordIdValue =
        lookupFieldValue[`_${jsonMapping.lookupOtherTable}_value`];
    } else {
      jsonMapping.recordIdValue = contextInfo.entityId;
    }

    return jsonMapping;
  }
};

export default App;
