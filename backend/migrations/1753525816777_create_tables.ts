import {
  ColumnDefinitions,
  MigrationBuilder,
  PgLiteral,
} from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = {
  id: {
    type: "INT",
    primaryKey: true,
    sequenceGenerated: {
      precedence: "ALWAYS",
    },
  },
  created_at: {
    type: "TIMESTAMPTZ",
    notNull: true,
    default: new PgLiteral("current_timestamp"),
  },
};

export function up(pgm: MigrationBuilder): void {
  pgm.createTable("employees", {
    id: "id",
    first_name: {
      type: "TEXT",
      notNull: true,
    },
    last_name: {
      type: "TEXT",
    },
    username: {
      type: "TEXT",
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: "TEXT",
      notNull: true,
    },
    salt: {
      type: "TEXT",
      notNull: true,
    },
    active: {
      type: "BOOLEAN",
      notNull: true,
      default: true,
    },
    created_at: "created_at",
  });

  pgm.createTable("roles", {
    id: "id",
    name: {
      type: "TEXT",
      notNull: true,
      unique: true,
    },
    active: {
      type: "BOOLEAN",
      notNull: true,
      default: true,
    },
    created_at: "created_at",
  });

  pgm.createTable("employee_roles", {
    employee_id: {
      type: "INT",
      primaryKey: true,
      notNull: true,
      references: "employees(id)",
      onDelete: "CASCADE",
    },
    role_id: {
      type: "INT",
      primaryKey: true,
      notNull: true,
      references: "roles(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.createType("edit_action", ["add", "remove"]);

  pgm.createTable("employee_roles_audit", {
    id: "id",
    target_employee: {
      type: "INT",
      references: "employees(id)",
      onDelete: "SET NULL",
    },
    action: {
      type: "edit_action",
      notNull: true,
    },
    role_id: {
      type: "INT",
      references: "roles(id)",
      onDelete: "SET NULL",
    },
    changed_on: "created_at",
    changed_by: {
      type: "INT",
      references: "employees(id)",
      onDelete: "SET NULL",
    },
  });

  pgm.createFunction(
    "employee_roles_audit_delete_if_null_fks_fn",
    [],
    {
      returns: "trigger",
      language: "plpgsql",
    },
    `
    BEGIN
      IF NEW.target_employee IS NULL AND NEW.role_id IS NULL AND NEW.changed_by IS NULL THEN
        DELETE FROM employee_roles_audit WHERE id = NEW.id;
      END IF;
      RETURN NULL;
    END;
    `,
  );

  pgm.createTrigger(
    "employee_roles_audit",
    "employee_roles_audit_delete_if_null_fks",
    {
      when: "AFTER",
      operation: "UPDATE",
      function: "employee_roles_audit_delete_if_null_fks_fn",
      level: "ROW",
    },
  );

  pgm.createType("permission", ["a", "b", "c"]);

  pgm.createTable("role_permissions", {
    role_id: {
      type: "INT",
      notNull: true,
      primaryKey: true,
      references: "roles(id)",
      onDelete: "CASCADE",
    },
    permission: {
      type: "permission",
      notNull: true,
      primaryKey: true,
    },
  });

  pgm.createTable("role_permissions_audit", {
    id: "id",
    target_role: {
      type: "INT",
      references: "roles(id)",
      onDelete: "CASCADE",
    },
    action: {
      type: "edit_action",
      notNull: true,
    },
    permission: {
      type: "permission",
      notNull: true,
    },
    changed_on: "created_at",
    changed_by: {
      type: "INT",
      references: "employees(id)",
      onDelete: "SET NULL",
    },
  });

  pgm.createTable("products", {
    id: "id",
    name: {
      type: "TEXT",
      notNull: true,
    },
    description: {
      type: "TEXT",
    },
    sku: {
      type: "TEXT",
      notNull: true,
      unique: true,
    },
    stock: {
      type: "INT",
      notNull: true,
      check: "stock >= 0",
    },
    active: {
      type: "BOOLEAN",
      notNull: true,
      default: true,
    },
    created_at: "created_at",
  });

  pgm.createTable("product_prices", {
    id: "id",
    product_id: {
      type: "INT",
      notNull: true,
      references: "products(id)",
      onDelete: "CASCADE",
    },
    price: {
      type: "numeric(15,6)",
      notNull: true,
      check: "price >= 0",
    },
    changed_on: "created_at",
    changed_by: {
      type: "INT",
      references: "employees(id)",
      onDelete: "SET NULL",
    },
  });

  pgm.createTable("categories", {
    id: "id",
    name: {
      type: "TEXT",
      notNull: true,
      unique: true,
    },
  });

  pgm.createTable("product_categories", {
    product_id: {
      type: "INT",
      notNull: true,
      primaryKey: true,
      references: "products(id)",
      onDelete: "CASCADE",
    },
    category_id: {
      type: "INT",
      notNull: true,
      primaryKey: true,
      references: "categories(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.createTable("promotions", {
    id: "id",
    name: {
      type: "TEXT",
      notNull: true,
      unique: true,
    },
    request_code: {
      type: "TEXT",
      unique: true,
    },
    product_id: {
      type: "INT",
      references: "products(id)",
      onDelete: "CASCADE",
    },
    req_in: {
      type: "INT",
      notNull: true,
      check: "req_in >= 0",
    },
    discount: {
      type: "NUMERIC(5,2)",
      notNull: true,
      check: "discount > 0 AND discount <= 100",
    },
    max_out: {
      type: "INT",
      check: "max_out IS NULL OR max_out > 0",
    },
    start_date: {
      type: "TIMESTAMPTZ",
      notNull: true,
    },
    end_date: {
      type: "TIMESTAMPTZ",
      notNull: true,
    },
    active: {
      type: "BOOLEAN",
      notNull: true,
      default: true,
    },
  });

  pgm.createFunction(
    "prevent_update",
    [],
    {
      returns: "trigger",
      language: "plpgsql",
    },
    `
    BEGIN
      RAISE EXCEPTION 'Updates are not allowed on this table';
    END;
    `,
  );

  pgm.createTrigger("promotions", "promotions_prevent_update", {
    when: "BEFORE",
    operation: "UPDATE",
    function: "prevent_update",
    level: "ROW",
  });

  pgm.createTable("rewards_setting", {
    id: "id",
    points_per_dollar: {
      type: "NUMERIC(10,4)",
      notNull: true,
    },
    dollar_per_points: {
      type: "NUMERIC(10,4)",
      notNull: true,
    },
    changed_on: "created_at",
  });

  pgm.createDomain("email", "TEXT", {
    check:
      "value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'",
  });

  pgm.createTable("customers", {
    id: "id",
    first_name: {
      type: "TEXT",
      notNull: true,
    },
    last_name: {
      type: "TEXT",
      notNull: true,
    },
    email: {
      type: "EMAIL",
      notNull: true,
      unique: true,
    },
    points: {
      type: "INT",
      notNull: true,
      default: 0,
    },
  });

  pgm.createTable("purchases", {
    id: "id",
    customer_id: {
      type: "INT",
      references: "customers(id)",
      onDelete: "SET NULL",
    },
    purchase_date: "created_at",
    points_redeemed: {
      type: "INT",
      notNull: true,
      default: 0,
    },
  });

  pgm.createTable("purchase_items", {
    id: "id",
    purchase_id: {
      type: "INT",
      notNull: true,
      references: "purchases(id)",
      onDelete: "CASCADE",
    },
    product_id: {
      type: "INT",
      references: "products(id)",
      onDelete: "SET NULL",
    },
    units: {
      type: "INT",
      notNull: true,
      check: "units > 0",
    },
    price_per_unit: {
      type: "NUMERIC(15,6)",
      notNull: true,
      check: "price_per_unit >= 0",
    },
    points_redeemed: {
      type: "INT",
      notNull: true,
      default: 0,
      check: "points_redeemed >= 0",
    },
  });

  pgm.createTable("purchase_item_promotions", {
    id: "id",
    purchase_item_id: {
      type: "INT",
      notNull: true,
      references: "purchase_items(id)",
      onDelete: "CASCADE",
    },
    promotion_id: {
      type: "INT",
      notNull: true,
      references: "promotions(id)",
      onDelete: "SET NULL",
    },
    units: {
      type: "INT",
      notNull: true,
      check: "units > 0",
    },
    discount_per_unit: {
      type: "NUMERIC(15,6)",
      notNull: true,
      check: "discount_per_unit > 0",
    },
  });

  pgm.createTable("refunds", {
    id: "id",
    purchase_id: {
      type: "INT",
      notNull: true,
      references: "purchases(id)",
      onDelete: "CASCADE",
    },
    refund_date: "created_at",
  });

  pgm.createTable("refund_items", {
    id: "id",
    refund_id: {
      type: "INT",
      notNull: true,
      references: "refunds(id)",
      onDelete: "CASCADE",
    },
    purchase_item_id: {
      type: "INT",
      notNull: true,
      references: "purchase_items(id)",
      onDelete: "CASCADE",
    },
    units: {
      type: "INT",
      notNull: true,
      check: "units > 0",
    },
  });
}
