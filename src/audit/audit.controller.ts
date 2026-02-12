import { Controller, Get } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller()
export class AuditController {
  constructor(private readonly AuditService: AuditService) {}
  @Get('/admin/audit')
  getLogs() {
    return this.AuditService.getLogs();
  }
}
