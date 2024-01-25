#[macro_use]
extern crate rocket;

use wikigraph::data::Data;

use rocket::State;
use rocket::fs::{relative, FileServer};

use rocket::response::stream::{Event, EventStream};
use rocket::serde::json::json;

use rocket::tokio::time::{self, Duration};
use rocket::tokio::sync::Mutex;

use std::sync::Arc;

// type shorthands
type Focus = Arc<Mutex<Option<String>>>;
type AsyncData = Arc<Mutex<Data>>;

// get data
#[get("/data")]
fn data<'a>(data: &'a State<AsyncData>, focus: &'a State<Focus>) -> EventStream![Event + 'a] {
    EventStream! {
        // sampling interval
        let mut interval = time::interval(Duration::from_millis(500));

        loop {
            // update data
            let mut data = data.lock().await;
            data.update().unwrap();

            let focus = focus.lock().await.to_owned();

            // create json
            let json = json!({
                "links":  data.links,
                "titles": data.titles,
                "focus":  focus,
            });

            yield Event::json(&json);
            interval.tick().await;
        }
    }
}

// focus node
#[post("/focus/<id>")]
async fn focus(id: &str, focus: &State<Focus>) {
    let mut focus = focus.lock().await;
    *focus = if id == "index" { None } else { Some(id.to_string()) };
}

// run rocket
#[launch]
fn rocket() -> _ {
    rocket::build()
        .manage(Arc::new(Mutex::new(Data::new())))
        .manage(Arc::new(Mutex::new(None::<String>)))
        .mount("/", FileServer::from(relative!("static")))
        .mount("/", routes![data, focus])
}
