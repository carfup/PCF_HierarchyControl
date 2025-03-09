import { Mapping, fieldDefinition } from "./EntitiesDefinition";

export class DataFormatter {
  public static formatJson(
    jsonData: any,
    fields: any,
    mapping: any,
    renameKey: Function,
    isLookup: Function
  ) {
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

  public static extractFields(jsonMapping: Mapping): fieldDefinition[] {
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
}
