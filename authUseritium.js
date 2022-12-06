/**
 * USERITIUM X TYROSERV AUTH
 * @api : https://usertium.fr/api-externe/ 
 * @repo : https://github.com/TheMaxium69/ApiUsertium
 * 
 */


function authUseritium (email, mdp) {

    param = "email_useritium="+email+"&mdp_useritium="+mdp

    let myRequest = new XMLHttpRequest();
    myRequest.open('POST', 'http://localhost/ApiUsertium-TyroServ/index.php?controller=TyroServ&task=connect');
    myRequest.onload = () => {

        var reponse = JSON.parse(myRequest.responseText);
        console.log(reponse);

        if(reponse['status'] == "true"){
          
          isConnect(reponse, email, mdp);

        } else { notif(reponse['status'], reponse['why']); }

      };
    myRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    myRequest.send(param);

}

function isConnect (reponse, email, mdp){

  message = "Vous êtes bien connectez à votre compte Useritium !"
  notif("true", message);

  if(reponse['why'] == "first connexion"){
      info = "Il s'agit de votre première connexion"
      notif("info", info);

      firstConnexion();
  }

  if(reponse['why'] == "successfully connected"){
    var userTyroServLoad = reponse['result'];

    startMinecraft(userTyroServLoad);
  }

}

function startMinecraft (userTyroServLoad){
  
  message = "Votre jeux ce lance avec le pseudo "+userTyroServLoad['pseudo']+" !"

  notif("true", message);

  let uuid_tyroserv = "505874d8-f150-4685-add1-041453f6d713"
  ipc.send("login", {username_tyroserv: userTyroServLoad['pseudo'], uuid_tyroserv: uuid_tyroserv, token_tyroserv: userTyroServLoad['token'], token_tyroserv_a2f: userTyroServLoad['tokenTwo']})
    
}

function firstConnexion(){

  

  console.log('firstconnexion');
}