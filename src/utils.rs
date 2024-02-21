use markdown::{Options, ParseOptions, Constructs};
use scraper::{Html, Selector};

use gray_matter::Matter;
use gray_matter::engine::YAML;

use anyhow::{Result, Context};

use std::fs;
use std::path::{Path, PathBuf};

// path basename
pub fn basename(path: &Path) -> Result<String> {
    let basename =
        path
            .file_stem()
            .context("")?
            .to_str()
            .context("")?
            .to_string();

    Ok(basename)
}

// file info
pub fn file_info(file: &PathBuf) -> Result<(String, Vec<String>)> {
    // file data
    let content  = fs::read_to_string(file)?;
    let basename = basename(file)?;

    // frontmatter title
    let title =
        Matter::<YAML>::new()
            .parse(&content)
            .data
            .context("")?["title"]
            .as_string()
            .unwrap_or(basename);

    // parse markdown
    let doc = markdown::to_html_with_options(
        &content,
        &markdown_options()
    ).unwrap();

    // outgoing links
    let outgoing =
        Html::parse_document(&doc)
            .select(&Selector::parse("a[href]").unwrap())
            .filter_map(|link| {
                link.attr("href")
                    .map(|href| href.to_string())
            }).collect();

    Ok((title, outgoing))
}

// gfm options with frontmatter
pub fn markdown_options() -> Options {
    Options {
        parse: ParseOptions {
            constructs: Constructs {
                frontmatter: true,
                ..Constructs::gfm()
            },
            ..ParseOptions::default()
        },
        ..Options::gfm()
    }
}
