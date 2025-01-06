use rand::Rng;

pub fn generate_random_string(length: usize) -> String {
    let characters: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let mut result = String::with_capacity(length);
    let characters_length = characters.len();
    
    let mut rng = rand::thread_rng();
    for _ in 0..length {
        let idx = rng.gen_range(0..characters_length);
        result.push(characters.chars().nth(idx).unwrap());
    }
    
    result
}
