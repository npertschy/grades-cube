// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:db/Notenwuerfel.sqlite", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
