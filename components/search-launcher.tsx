"use client";

import * as React from "react";
import { ExternalLink, Globe, Search, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import {
  buildSearchGroups,
  essentialLinks,
  normalizeUrl,
  type SearchGroup,
} from "@/lib/search-links";
import type { TourismSector } from "@/lib/types";

interface SearchLauncherProps {
  companyName: string;
  jobTitle: string;
  sector: TourismSector;
  homepageUrl: string;
}

export function SearchLauncher({
  companyName,
  jobTitle,
  sector,
  homepageUrl,
}: SearchLauncherProps) {
  const groups = React.useMemo(
    () => buildSearchGroups(companyName, jobTitle, sector, homepageUrl),
    [companyName, jobTitle, sector, homepageUrl],
  );

  if (groups.length === 0) return null;

  const essentials = essentialLinks(groups);
  const homepage = normalizeUrl(homepageUrl);

  function openEssentials() {
    // 브라우저 팝업 차단을 피하려고 약간의 간격을 둡니다.
    essentials.forEach((link, index) => {
      window.setTimeout(() => window.open(link.url, "_blank", "noopener"), index * 220);
    });
  }

  return (
    <Card className="print-block">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="field-label">1단계 · 자료 수집</p>
            <CardTitle className="mt-1.5 flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" />
              {companyName} 조사하기
            </CardTitle>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            {homepage ? (
              <Button variant="outline" size="sm" asChild>
                <a href={homepage} target="_blank" rel="noopener noreferrer">
                  <Globe />
                  홈페이지
                </a>
              </Button>
            ) : null}
            <Button size="sm" onClick={openEssentials}>
              <Star />
              필수 {essentials.length}개 한번에 열기
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert tone="info">
          링크를 눌러 새 탭에서 자료를 확인하고, <strong>쓸 만한 내용을 복사해서</strong> 왼쪽
          &lsquo;수집한 자료&rsquo; 칸에 붙여넣으세요. 기사 제목과 날짜만 모아도 충분합니다.
        </Alert>

        <div className="space-y-4">
          {groups.map((group) => (
            <SearchGroupBlock key={group.key} group={group} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SearchGroupBlock({ group }: { group: SearchGroup }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-sm font-semibold">{group.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>

      <ul className="mt-2.5 space-y-1.5">
        {group.links.map((link) => (
          <li key={link.url + link.label}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 rounded-md p-2 transition-colors hover:bg-accent/60"
            >
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">
                    {link.label}
                  </span>
                  {link.essential ? <Badge variant="default">필수</Badge> : null}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {link.purpose}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
