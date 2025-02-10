export interface Mapping {
  parentField: string;
  recordIdField: string;
  mapping: attributesMapping;
  properties?: propertiesMapping;
  isCurrentRecord: boolean;
}

export interface attributesMapping {
  name: string;
  attribute1?: string;
  attribute2?: string;
  attribute3?: string;
}

export interface propertiesMapping {
  height?: number;
  width?: number;
}

export interface fieldDefinition {
  name: string;
  webapiName?: string;
  type?: string;
  displayName?: string;
}
