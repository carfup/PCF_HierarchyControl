export interface Mapping {
  entityName?: string;
  parentField: string;
  recordIdField: string;
  lookupOtherTable?: string;
  mapping: Array<string>;
  properties?: propertiesMapping;
  isCurrentRecord?: boolean;
  recordIdValue?: string;
  image?: string;
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
  showZoom?: boolean;
  showSearch?: boolean;
  showRecordPicture?: boolean;
  position?: undefined | "top" | "centered";
}

export interface fieldDefinition {
  name: string;
  webapiName?: string;
  type?: string;
  displayName?: string;
  statecode? : number;
}
