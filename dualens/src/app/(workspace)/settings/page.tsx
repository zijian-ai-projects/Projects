"use client";

import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { SettingRow } from "@/components/common/setting-row";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export default function SettingsPage() {
  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title="通用设置"
        description="集中管理语言、默认模型、角色风格、历史保留策略与数据操作，使辩论体验在所有页面保持一致。"
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="基础偏好" description="决定默认语言与每次进入辩论页时的初始行为。">
          <SettingRow
            label="语言设置"
            hint="控制主要界面默认使用中文还是 English。"
            control={
              <Select defaultValue="zh-CN">
                <option value="zh-CN">中文</option>
                <option value="en">English</option>
              </Select>
            }
          />
          <SettingRow
            label="默认模型"
            hint="进入辩论页时预先选中的模型。"
            control={
              <Select defaultValue="deepseek-chat">
                <option value="deepseek-chat">deepseek-chat</option>
                <option value="deepseek-reasoner">deepseek-reasoner</option>
                <option value="gpt-4.1">gpt-4.1</option>
              </Select>
            }
          />
          <SettingRow
            label="默认辩论角色风格"
            hint="设定默认采用哪一种角色风格配对。"
            control={
              <Select defaultValue="cautious-aggressive">
                <option value="cautious-aggressive">谨慎 / 激进</option>
                <option value="rational-intuitive">理性 / 直觉</option>
                <option value="cost-benefit">成本 / 收益</option>
              </Select>
            }
          />
        </SectionCard>

        <SectionCard title="记录与数据" description="管理会话留存周期、导出能力与本地缓存。">
          <SettingRow
            label="历史记录保存策略"
            hint="为历史页设定默认保留周期与自动清理策略。"
            control={
              <Select defaultValue="180">
                <option value="30">保留 30 天</option>
                <option value="90">保留 90 天</option>
                <option value="180">保留 180 天</option>
                <option value="forever">永久保留</option>
              </Select>
            }
          />
          <SettingRow
            label="数据导出"
            hint="导出当前应用的辩论记录与配置快照。"
            control={<Button type="button" variant="secondary">导出数据</Button>}
          />
          <SettingRow
            label="清除缓存"
            hint="清理本地缓存、临时状态与上次会话残留。"
            control={<Button type="button">清除缓存</Button>}
          />
        </SectionCard>
      </div>
    </div>
  );
}
