export interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "select";
  options?: string[];
  order: number;
  defaultValue?: any;
}

export interface BlockTypeDefinition {
  id: string;
  name: string;
  propertiesDefinition: FieldDefinition[];
  createdAt?: string;
  updatedAt?: string;
}
