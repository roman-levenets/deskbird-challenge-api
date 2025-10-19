import { BadRequestException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import postgres, { Sql } from 'postgres';
import camelcase from 'camelcase';
import * as process from 'node:process';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private sql: Sql;

  get connection(): Sql<Record<string, unknown>> {
    return this.sql;
  }

  async onModuleInit(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL as string;
    if (!databaseUrl) {
      throw new BadRequestException('Missing database connection env vars');
    }

    this.sql = postgres(databaseUrl, {
      transform: {
        column: camelcase,
      },
    });
  }

  async onModuleDestroy() {
    await this.sql.end({ timeout: 5 });
  }
}
