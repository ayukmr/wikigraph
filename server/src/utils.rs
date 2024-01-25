use pandoc::{InputFormat, OutputKind, MarkdownExtension, PandocOutput};
use scraper::{Html, Selector};

use anyhow::{Result, Context};

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
    // pandoc generator
    let mut pandoc = pandoc::new();

    // input and output
    pandoc.add_input(&file);
    pandoc.set_output(OutputKind::Pipe);

    // allow wikilinks
    pandoc.set_input_format(
        InputFormat::CommonmarkX,
        vec![MarkdownExtension::Other(String::from("wikilinks_title_after_pipe"))]
    );

    // selectors
    let title_selector = Selector::parse("h1").unwrap();
    let links_selector = Selector::parse("a[href]").unwrap();

    if let PandocOutput::ToBuffer(doc) = pandoc.execute()? {
        let basename = basename(file)?;
        let html = Html::parse_document(&doc);

        // title from heading
        let title =
            html.select(&title_selector)
                .next()
                .map(|elem| {
                    elem
                        .text()
                        .next()
                        .unwrap_or(&basename)
                })
                .unwrap_or(&basename)
                .to_string();

        // outgoing links
        let outgoing = html.select(&links_selector).filter_map(|link| {
            link.attr("href").map(|href| href.to_string())
        }).collect();

        Ok((title, outgoing))
    } else {
        unreachable!()
    }
}
