// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: include_str!("../sql/initial-schema.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add unique constraint to ZSUBJECT.ZNAME",
            sql: "CREATE UNIQUE INDEX IF NOT EXISTS idx_zsubject_zname_unique ON ZSUBJECT (ZNAME);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "enable WAL mode to allow concurrent readers with a writer",
            sql: "PRAGMA journal_mode=WAL;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "enforce one grade per student per performance",
            sql: "DELETE FROM ZGRADE \
                  WHERE Z_PK NOT IN (SELECT MIN(Z_PK) FROM ZGRADE GROUP BY ZPERFORMANCE, ZSTUDENT); \
                  CREATE UNIQUE INDEX IF NOT EXISTS idx_zgrade_performance_student_unique \
                  ON ZGRADE (ZPERFORMANCE, ZSTUDENT);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add course level and ordinal",
            sql: "ALTER TABLE ZCOURSE ADD COLUMN ZLEVEL INTEGER DEFAULT 0; \
                  ALTER TABLE ZCOURSE ADD COLUMN ZORDINAL INTEGER DEFAULT 0;",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .setup(|app| {
            let app_config_dir = app.path().app_config_dir()?;
            let db_dir = app_config_dir.join("db");
            fs::create_dir_all(&db_dir)?;
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:db/Notenwuerfel.sqlite?mode=rwc", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
