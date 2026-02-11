import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  private logs: any[] = [];

  log(event: string, details: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      details,
    };
    this.logs.push(entry);
    console.log('[AUDIT]', entry);
  }

  getLogs(){
    return this.logs
  }
}
