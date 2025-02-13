import { useState, useEffect } from "react";
import * as React from "react";
import OrgChartComponent from "./OrgChartComponent";
import { Mapping, fieldDefinition } from "../EntitiesDefinition";

const App = (props: any) => {
  const [data, setData] = useState(null);

  const contextInfo = props.context.mode.contextInfo;
  const recordId = contextInfo.entityId;
  const entityTypeName = contextInfo.entityTypeName;
  const jsonMapping: Mapping = JSON.parse(props.jsonMapping);
  const fields = extractField(jsonMapping);
  let primaryIdAttribute = "";

  useEffect(() => {
    const getAllData = async () => {
      // Get attributes details
      const dataEM = await props.context.utils.getEntityMetadata(
        entityTypeName,
        fields.map((u) => u.name)
      );

      // retrive attributes details and formatting
      primaryIdAttribute = dataEM.PrimaryIdAttribute;
      getAttributeDetails(dataEM);

      const getTopParentData =
        await props.context.webAPI.retrieveMultipleRecords(
          entityTypeName,
          `?$filter=
            Microsoft.Dynamics.CRM.Above(PropertyName='${
              jsonMapping.recordIdField
            }',PropertyValue='${recordId}')
            &$select=${fields.map((u) => u.webapiName).join(",")}`
        );

      const getTopParentDataId =
        getTopParentData.entities.length == 0
          ? recordId
          : getTopParentData.entities.filter(
              (x: any) => x[`_${jsonMapping.parentField}_value`] == null
            )[0][jsonMapping.recordIdField];

      // get all records below the top parent
      const getChildrenData =
        await props.context.webAPI.retrieveMultipleRecords(
          entityTypeName,
          `?$filter=
         Microsoft.Dynamics.CRM.UnderOrEqual(PropertyName='${
           jsonMapping.recordIdField
         }',PropertyValue='${getTopParentDataId}') 
         &$select=${fields.map((u) => u.webapiName).join(",")}
        `
        );

      // format the data
      const jsonData = formatJson(getChildrenData.entities, jsonMapping);

      // set the data
      setData(jsonData);
    };

    getAllData();
  }, [true]);
  return (
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
      <OrgChartComponent data={data} currentRecordId={recordId} />
    </div>
  );

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

  function formatJson(jsonData: any, jsonMapping: Mapping) {
    const targetJson: any = [];

    jsonData.forEach((obj: any) => {
      const propsTarget: any = {};

      renameKey(obj, isLookup(jsonMapping.recordIdField), "id", propsTarget);
      renameKey(
        obj,
        isLookup(jsonMapping.parentField),
        "parentId",
        propsTarget
      );
      renameKey(obj, isLookup(jsonMapping.mapping.name), "name", propsTarget);
      renameKey(
        obj,
        isLookup(jsonMapping.mapping.attribute1!),
        "attribute1",
        propsTarget
      );
      renameKey(
        obj,
        isLookup(jsonMapping.mapping.attribute2!),
        "attribute2",
        propsTarget
      );
      renameKey(
        obj,
        isLookup(jsonMapping.mapping.attribute3!),
        "attribute3",
        propsTarget
      );
      //HIHIH
      targetJson.push(propsTarget);
    });

    return targetJson;
  }

  function isLookup(field: string) {
    const f = fields.find((f: any) => f.name === field)?.type;
    return f === "lookup" ? `_${field}_value` : field;
  }

  function extractField(jsonMapping: Mapping) {
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
    return fields;
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
};

export default App;
