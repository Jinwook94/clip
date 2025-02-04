import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";

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

export default function BlockTypesPage() {
  const { t } = useTranslation();
  const [blockTypes, setBlockTypes] = useState<BlockTypeDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingBlockType, setEditingBlockType] =
    useState<BlockTypeDefinition | null>(null);

  const loadBlockTypes = async () => {
    const result = await window.ipcRenderer.invoke("blockTypes-load");
    setBlockTypes(result);
    setLoading(false);
  };

  useEffect(() => {
    loadBlockTypes();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await window.ipcRenderer.invoke("blockTypes-delete", id);
      loadBlockTypes();
    }
  };

  const handleEdit = (bt: BlockTypeDefinition) => {
    setEditingBlockType(bt);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingBlockType(null);
    setModalOpen(true);
  };

  const handleModalSubmit = async (bt: BlockTypeDefinition) => {
    if (bt.id) {
      await window.ipcRenderer.invoke("blockTypes-update", bt);
    } else {
      await window.ipcRenderer.invoke("blockTypes-create", bt);
    }
    setModalOpen(false);
    loadBlockTypes();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Block Types</h1>
      <Button onClick={handleCreate} className="mb-4">
        <IconPlus className="w-4 h-4 mr-1" />
        Create New Block Type
      </Button>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-2">
          {blockTypes.map((bt) => (
            <div
              key={bt.id}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div>{bt.name}</div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => handleEdit(bt)}>
                  <IconEdit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(bt.id)}
                >
                  <IconTrash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <BlockTypeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleModalSubmit}
          initialData={editingBlockType}
        />
      )}
    </div>
  );
}

interface BlockTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BlockTypeDefinition) => void;
  initialData?: BlockTypeDefinition | null;
}

function BlockTypeModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: BlockTypeModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [fields, setFields] = useState<FieldDefinition[]>(
    initialData?.propertiesDefinition || [],
  );

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        key: "",
        label: "",
        type: "text",
        order: fields.length,
        defaultValue: "",
      },
    ]);
  };

  const handleFieldChange = (index: number, field: FieldDefinition) => {
    const newFields = [...fields];
    newFields[index] = field;
    setFields(newFields);
  };

  const handleRemoveField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
  };

  const handleSubmit = () => {
    const bt: BlockTypeDefinition = {
      id: initialData?.id || "",
      name,
      propertiesDefinition: fields,
    };
    onSubmit(bt);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Block Type" : "Create Block Type"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Name:</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Fields:</span>
              <Button onClick={handleAddField} variant="ghost">
                <IconPlus className="w-4 h-4" />
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={index} className="border p-2 rounded mb-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm">Key:</label>
                    <Input
                      value={field.key}
                      onChange={(e) =>
                        handleFieldChange(index, {
                          ...field,
                          key: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Label:</label>
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        handleFieldChange(index, {
                          ...field,
                          label: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Type:</label>
                    <select
                      value={field.type}
                      onChange={(e) =>
                        handleFieldChange(index, {
                          ...field,
                          type: e.target.value as any,
                        })
                      }
                      className="border p-1 w-full"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="number">Number</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">Order:</label>
                    <Input
                      type="number"
                      value={field.order}
                      onChange={(e) =>
                        handleFieldChange(index, {
                          ...field,
                          order: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="mt-2"
                  onClick={() => handleRemoveField(index)}
                >
                  Remove Field
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {initialData ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
