"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { NewsletterSubscriber } from "@/interface/newsletter";
import { deleteSubscriber } from "@/app/admin/actions";

interface SubscribersTableProps {
  subscribers: NewsletterSubscriber[];
}

const SubscribersTable = ({ subscribers }: SubscribersTableProps) => {
  const [rows, setRows] = useState<NewsletterSubscriber[]>(subscribers);

  const handleDelete = async (id: string) => {
    const prev = rows;
    setRows((r) => r.filter((s) => s.id !== id));

    const result = await deleteSubscriber(id);
    if (!result.success) {
      setRows(prev);
      toast.error("Não foi possível remover");
    } else {
      toast.success("Subscritor removido");
    }
  };

  const handleExport = () => {
    const header = "email,subscrito_em\n";
    const body = rows
      .map((s) => `${s.email},${new Date(s.created_at).toISOString()}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscritores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-body text-sm text-muted-foreground">
          {rows.length} subscritor{rows.length === 1 ? "" : "es"}
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={rows.length === 0}
          className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 font-body text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center font-body text-sm text-muted-foreground">
          Ainda não há subscritores.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 font-body text-xs font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-2 font-body text-xs font-medium text-muted-foreground">
                  Subscrito em
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2 font-body text-sm text-foreground">
                    {s.email}
                  </td>
                  <td className="px-4 py-2 font-body text-sm text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remover subscritor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubscribersTable;
