use actix_web::{HttpResponse, Responder};


pub async fn handle_get_user() -> impl Responder {
  HttpResponse::Ok().body("TODO")
}
pub async fn handle_login() -> impl Responder {
  HttpResponse::Ok().body("TODO")
}
pub async fn handle_logout() -> impl Responder {
  HttpResponse::Ok().body("TODO")
}
pub async fn handle_register() -> impl Responder {
  HttpResponse::Ok().body("TODO")
}
pub async fn handle_update_user() -> impl Responder {
  HttpResponse::Ok().body("TODO")
}
pub async fn handle_change_password() -> impl Responder {
  HttpResponse::Ok().body("TODO")
}