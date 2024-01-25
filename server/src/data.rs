use crate::utils::{basename, file_info};

use serde::Serialize;

use rayon::prelude::*;
use anyhow::{Result, Context};

use std::time::SystemTime;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

// node info
pub type Links  = HashMap<String, Vec<String>>;
pub type Titles = HashMap<String, String>;

// file modifications
pub type FileMods = Vec<(PathBuf, SystemTime)>;

// file data
#[derive(Serialize)]
pub struct Data {
    pub links:  Links,
    pub titles: Titles,
    pub files:  FileMods,
}

impl Data {
    // create data
    pub fn new() -> Self {
        Self {
            links:  HashMap::new(),
            titles: HashMap::new(),
            files:  Vec::new(),
        }
    }

    // update data
    pub fn update(&mut self) -> Result<()> {
        // path from args
        let glob_path = Path::new(
            &std::env::args()
                .into_iter()
                .skip(1)
                .next()
                .context("")?
        ).join("**/*.md");

        let glob_str =
            glob_path
                .to_str()
                .context("")?;

        // glob files
        let files = glob::glob(&glob_str)?
            .filter_map(Result::ok)
            .filter(|file| {
                basename(file)
                    .is_ok_and(|basename| basename != "index")
            })
            .filter_map(|file| {
                std::fs::metadata(&file)
                    .and_then(|metadata| {
                        Ok((
                            file,
                            metadata.modified()?,
                        ))
                    })
                    .ok()
            })
            .collect::<Vec<_>>();

        // file names
        let old_names:  Vec<_> = self.files.iter().map(|(file, _)| file).collect();
        let file_names: Vec<_> = files.iter().map(|(file, _)| file).collect();

        // removed files
        old_names
            .iter()
            .filter(|file| !file_names.contains(file))
            .for_each(|file| {
                if let Ok(basename) = basename(&file.to_path_buf()) {
                    // remove file
                    self.titles.remove(&basename);
                    self.links.remove(&basename);
                }
            });

        // updated files
        files
            .par_iter()
            .filter(|(file, mod_time)| {
                !old_names.contains(&file) ||
                self.files
                    .iter()
                    .any(|(old_file, old_mod_time)| {
                        old_file == file && old_mod_time != mod_time
                    })
            })
            .filter_map(|(file, _)| {
                let path = file.to_path_buf();

                basename(&path)
                    .and_then(|basename| {
                        let (title, outgoing) = file_info(&path)?;
                        Ok((basename, title, outgoing))
                    })
                    .ok()
            })
            .collect::<Vec<_>>()
            .iter()
            .for_each(|(basename, title, outgoing)| {
                // insert file
                self.titles.insert(basename.to_string(), title.to_string());
                self.links.insert(basename.to_string(),  outgoing.to_vec());
            });

        self.files = files;

        Ok(())
    }
}

impl Default for Data {
    // default data
    fn default() -> Self {
        Data::new()
    }
}
