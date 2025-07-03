import { useState, useEffect } from "react";
import * as React from "react";
import OrgChartComponent from "./OrgChartComponent";
import { fieldDefinition, Mapping } from "../EntitiesDefinition";
import { Button, Input } from "@fluentui/react-components";
import {ZoomInRegular,ZoomOutRegular,SearchRegular,PageFitRegular,ArrowNextRegular} from "@fluentui/react-icons";

const App = (props: any) => {
  const [data, setData] = useState(null);
  const [jsonMappingControl, setJsonMappingControl] = useState(null);
  const [searchOnGoing, setSearchOnGoing] = useState(true);

  const jsonMapping = JSON.parse(props.jsonMapping);

  // Check if the JSON input is valid
  jsonInputCheck();

  const contextInfo = props.context.mode.contextInfo;
  jsonMapping.entityName = contextInfo.entityTypeName;

  const fields: fieldDefinition[] = extractFields(jsonMapping);
  let clickZoom: any = null;
  let searchNode: any = null;
  let searchNextNode : any = null;

  useEffect(() => {
    const getAllData = async () => {
      // Get attributes details

      if(jsonMapping.properties.showRecordPicture) {
        const hasPicture = await hasEntityPicture(jsonMapping.entityName); 
        if (hasPicture) {
          jsonMapping.image = `${hasPicture}_url`;
          fields.push({  name: hasPicture });
        }
      }

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

      const isStateCodeAware = dataEM.IsStateModelAware;
      

      // get all records below the top parent
      const concatFields = fields
        .filter((f: fieldDefinition) => f.webapiName)
        .map((f: fieldDefinition) => f.webapiName)
        .join(",");


      const getChildrenData =
        await props.context.webAPI.retrieveMultipleRecords(
          jsonMapping.entityName,
          `?$filter=Microsoft.Dynamics.CRM.UnderOrEqual(PropertyName='${jsonMapping.recordIdField}',PropertyValue='${getTopParentDataId}')&$select=${concatFields}${isStateCodeAware ? ",statecode" : ""}`        );

      // format the data
      const jsonData: any = formatJson(getChildrenData.entities, jsonMapping);

      // Update the mapping passed to the OrgChartComponent
      setJsonMappingControl(jsonMapping as any);
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
        )}&nbsp;
          {jsonMapping.properties?.showSearch && (
          <Button
              icon={<ArrowNextRegular />}
              onClick={() => searchNext()}
              title="Search Next Result"
              disabled={searchOnGoing}
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
          setSearchNext={(s: any) => (searchNextNode = s)}
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
    setSearchOnGoing(value == "" || value == null);
  }

  function searchNext() {
    searchNextNode();
  }

  // align the json data into the expected format of the org-chart component
  function renameKey(obj: any,oldKey: string,newKey: string, targetJson: any) {
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

        const details = {
          value: getValue(obj[key], type),
          type: type,
          displayName: fields.find((f: any) => f.webapiName === oldKey)
            ?.displayName,
          statecode : obj.statecode !== undefined ? obj.statecode : null,
          targetRecord : type === "lookup" ? 
          { 
            table : obj[`${oldKey}@Microsoft.Dynamics.CRM.lookuplogicalname`],
            id : obj[oldKey]
          } : null
        };

        if(newKey == "attribute") {
          targetJson.push(details);
        }
        else {
          targetJson[newKey] = details;
        }
        
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
      fields[index].type = returnType(attr);
      fields[index].webapiName =
        em.PrimaryAttributeId != attr.LogicalName &&
        (attr.AttributeTypeName == "lookup" ||
          attr.AttributeTypeName == "owner" ||
          attr.AttributeTypeName == "customer")
          ? `_${attr.LogicalName}_value`
          : 
          fields[index].type === "image" ? `${attr.LogicalName}_url` : attr.LogicalName;
      
      fields[index].displayName = attr.DisplayName;
    });
  }

  function formatJson(jsonData: any, mapping: Mapping) {
    const targetJson: any[] = [];
    jsonData.forEach((obj: any) => {
      const propsTarget: any = {};
      propsTarget.attributes = [];
      renameKey(obj, isLookup(mapping.recordIdField), "id", propsTarget);
      renameKey(obj, isLookup(mapping.parentField), "parentId", propsTarget);
      renameKey(obj, isLookup(mapping.image!), "image", propsTarget);

      mapping.mapping.forEach((field: string, index : number) => {
        // First attribute is the main name of the node
        if(index == 0) {
          renameKey(obj, isLookup(field), "name", propsTarget);
        }
        // Other attributes are displayed in the node details
        else {
          renameKey(obj, isLookup(field), "attribute", propsTarget.attributes);
        }
      });
      
      targetJson.push(propsTarget);
    });
    return targetJson;
  }

  function extractFields(jsonMapping: Mapping): fieldDefinition[] {
    const fields: fieldDefinition[] = [];
    fields.push({ name: jsonMapping.recordIdField });
    fields.push({ name: jsonMapping.parentField });

    jsonMapping.mapping.forEach((field: string) => {
        fields.push({ name: field });
      }
    );

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

  async function hasEntityPicture(entityName: string) : Promise<string> {
    const pictureInfo = await props.context.webAPI.retrieveMultipleRecords(
        "entityimageconfig",
        `?$filter=parententitylogicalname eq '${entityName}'&$select=primaryimageattribute`
      );

    return pictureInfo.entities.length > 0 ? pictureInfo.entities[0].primaryimageattribute : "";
  }

  function jsonInputCheck(){
    if(jsonMapping.mapping.attribute1)
      alert("Hierarchy control PCF : \nPlease make sure that you updated the JSON schema of the Hierarchy control to properly works.\n\nPlease go to https://github.com/carfup/PCF_HierarchyControl to have the new JSON schema.")
  }
};

export default App;
