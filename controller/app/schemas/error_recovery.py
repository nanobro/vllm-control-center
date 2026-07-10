from typing import Literal

from pydantic import BaseModel, Field


RecoverySeverity = Literal['info', 'warning', 'critical']


class RecoveryAction(BaseModel):
    label: str
    description: str
    kind: Literal['copy', 'open_logs', 'open_settings', 'retry', 'change_preset', 'refresh', 'none'] = 'none'
    copy_text: str | None = None


class ErrorRecoveryAdvice(BaseModel):
    category: str
    severity: RecoverySeverity
    title: str
    summary: str
    likely_cause: str
    immediate_fixes: list[str] = Field(default_factory=list)
    actions: list[RecoveryAction] = Field(default_factory=list)
    raw_excerpt: str | None = None
