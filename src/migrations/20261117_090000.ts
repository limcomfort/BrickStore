import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Избранное и личный кабинет: коллекции `customers` и `favorites`
 * плюс необязательная связь заявки с покупателем.
 * Остальные таблицы не трогаем — база уже содержит их.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`customers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`email\` text NOT NULL,
  	\`name\` text NOT NULL,
  	\`session_token\` text,
  	\`session_expires_at\` text,
  	\`last_seen_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`customers_email_idx\` ON \`customers\` (\`email\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`customers_session_token_idx\` ON \`customers\` (\`session_token\`);`)
  await db.run(sql`CREATE INDEX \`customers_updated_at_idx\` ON \`customers\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`customers_created_at_idx\` ON \`customers\` (\`created_at\`);`)

  await db.run(sql`CREATE TABLE \`favorites\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`customer_id\` integer NOT NULL,
  	\`product_id\` integer NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`favorites_customer_idx\` ON \`favorites\` (\`customer_id\`);`)
  await db.run(sql`CREATE INDEX \`favorites_product_idx\` ON \`favorites\` (\`product_id\`);`)
  // Один товар не может быть в избранном дважды у одного покупателя
  await db.run(
    sql`CREATE UNIQUE INDEX \`favorites_customer_product_idx\` ON \`favorites\` (\`customer_id\`, \`product_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`favorites_updated_at_idx\` ON \`favorites\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`favorites_created_at_idx\` ON \`favorites\` (\`created_at\`);`)

  // Заявки гостей остаются валидными: связь необязательная
  await db.run(
    sql`ALTER TABLE \`inquiries\` ADD COLUMN \`customer_id\` integer REFERENCES customers(id) ON UPDATE no action ON DELETE set null;`,
  )
  await db.run(sql`CREATE INDEX \`inquiries_customer_idx\` ON \`inquiries\` (\`customer_id\`);`)

  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`customers_id\` integer REFERENCES customers(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_customers_id_idx\` ON \`payload_locked_documents_rels\` (\`customers_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`favorites_id\` integer REFERENCES favorites(id) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_favorites_id_idx\` ON \`payload_locked_documents_rels\` (\`favorites_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_favorites_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`favorites_id\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_customers_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`customers_id\`;`)

  await db.run(sql`DROP INDEX IF EXISTS \`inquiries_customer_idx\`;`)
  await db.run(sql`ALTER TABLE \`inquiries\` DROP COLUMN \`customer_id\`;`)

  await db.run(sql`DROP TABLE \`favorites\`;`)
  await db.run(sql`DROP TABLE \`customers\`;`)
}
