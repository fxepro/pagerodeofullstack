"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { applyTheme } from "@/lib/theme";

export default function AdminFinancialsPage() {
  return (
    <div className={applyTheme.page()}>
      {/* Metrics Cards - Empty for now */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Metric 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">-</div>
            <p className="text-xs text-slate-500 mt-1">Coming soon</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Metric 2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">-</div>
            <p className="text-xs text-slate-500 mt-1">Coming soon</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Metric 3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">-</div>
            <p className="text-xs text-slate-500 mt-1">Coming soon</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Metric 4</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">-</div>
            <p className="text-xs text-slate-500 mt-1">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

