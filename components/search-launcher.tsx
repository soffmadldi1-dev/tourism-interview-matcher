"use client";

import * as React from "react";
import { ExternalLink, Globe, MousePointerClick, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-4">
      {/* 왜 직접 찾아야 하는가 */}
      <Card className="border-primary/30 bg-primary/5 print-block">
        <CardContent className="space-y-2.5 p-4">
          <p className="text-sm font-bold text-primary">
            링크를 열어 직접 읽고, 쓸 만한 내용을 복사해 오세요
          </p>
          <p className="text-[13px] leading-relaxed text-foreground/80">
            자동으로 긁어오지 않는 이유가 있습니다. <strong>직접 읽는 과정 자체가 면접
            준비</strong>이기 때문입니다. 남이 요약해 준 것만 외우면 꼬리질문에서 무너집니다.
          </p>
          <p className="text-[13px] leading-relaxed text-foreground/80">
            복사한 내용은 왼쪽 <strong>&lsquo;② 조사 자료&rsquo;</strong> 탭의 첫 번째 칸에
            붙여넣으세요. 정리하지 않아도 됩니다.
          </p>

          <div className="no-print flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={openEssentials}>
              <Star />
              필수 {essentials.length}개 한번에 열기
            </Button>
            {homepage ? (
              <Button variant="outline" size="sm" asChild>
                <a href={homepage} target="_blank" rel="noopener noreferrer">
                  <Globe />
                  홈페이지 바로가기
                </a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {groups.map((group) => (
        <SearchGroupCard key={group.key} group={group} />
      ))}
    </div>
  );
}

function SearchGroupCard({ group }: { group: SearchGroup }) {
  return (
    <Card className="print-block">
      <CardContent className="p-4">
        <div className="flex items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {group.step}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold">{group.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{group.goal}</p>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5 pl-0 sm:pl-8">
          {group.links.map((link) => (
            <li key={link.url + link.label}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-lg border border-border p-2.5 transition-colors hover:border-primary hover:bg-accent/50"
              >
                <span className="flex flex-wrap items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  <span className="text-[13px] font-semibold text-foreground group-hover:text-primary">
                    {link.label}
                  </span>
                  {link.essential ? <Badge variant="default">필수</Badge> : null}
                </span>
                <span className="mt-1 flex items-start gap-1.5 pl-5">
                  <MousePointerClick className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="text-[12px] leading-relaxed text-muted-foreground">
                    <strong className="text-foreground/70">복사할 것 —</strong> {link.copyThis}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
