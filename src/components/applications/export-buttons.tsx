"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";

export function ExportButtons() {
  const [isExporting, setIsExporting] = useState(false);
  const { t, locale } = useTranslation();

  const handleCSVExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/export/csv?locale=${locale}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `applications-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t.export.csvSuccess);
    } catch {
      toast.error(t.export.exportError);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {t.export.button}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCSVExport} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          {t.export.csv}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          {t.export.pdf}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
