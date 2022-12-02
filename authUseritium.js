/**
 * USERITIUM X TYROSERV AUTH
 * @api : https://usertium.fr/api-externe/tyroserv/ 
 * @repo : https://github.com/TheMaxium69/ApiUsertium-TyroServ
 * 
 */


function authUseritium (email, mdp) {



  /*
  API_USERITIUM ---> on envoie email & mdp
  LAUNCHER ---> RECOIE username uuid token

  */

  // est-ce que la connexion a marché
  let isValide = true


  // Resultat des requête
  let username_tyroserv = "TheMaximeSan"
  let uuid_tyroserv = "505874d8-f150-4685-add1-041453f6d713"
  let token_useritium_private = "YYYAZ4ea6z54eazae54"; 
  let token_useritium_public = "AezaezaZ4ea6z54eazae54"

  ipc.send("login", {username_tyroserv: username_tyroserv, uuid_tyroserv: uuid_tyroserv, token_useritium_private: token_useritium_private, token_useritium_public: token_useritium_public, isValide: isValide})
}