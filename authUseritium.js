/**
 * USERITIUM X TYROSERV AUTH
 * @api : https://usertium.fr/api-externe/ 
 * @repo : https://github.com/TheMaxium69/ApiUsertium
 * 
 */

function authUseritium (email, mdp) {

    param = "email_useritium="+email+"&mdp_useritium="+mdp

    let myRequest = new XMLHttpRequest();
    myRequest.open('POST', 'http://useritium.fr/api-externe/index.php?controller=TyroServ&task=connect');
    myRequest.onload = () => {

        var reponse = JSON.parse(myRequest.responseText);

        if(reponse['status'] == "true"){
          
          isConnect(reponse, email, mdp);

        } else { notif(reponse['status'], reponse['why']); }

      };
    myRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    myRequest.send(param);

}

function isConnect (reponse, email, mdp){

  message = "Vous êtes bien connectez à votre compte Useritium !"
  notif("info", message);

  if(reponse['why'] == "first connexion"){
      info = "Il s'agit de votre première connexion"
      notif("info", info);

      firstConnexion(reponse['keep'] ,email, mdp);
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

function firstConnexion(pseudo, email, mdp){

  const form = document.querySelector('#form');
  form.innerHTML = '<h2>Compte Useritium</h2> <p>Première connexion</p> <input type="hidden" id="type" value="first" />  <input type="hidden" placeholder="Email" id="email" value="'+ email +'" /> <input type="hidden" placeholder="Mot de passe" id="password" value="'+ mdp +'" /> <input type="text" placeholder="Pseudo" id="pseudo" value="'+ pseudo +'" /> <button id="play" onclick="formFirst()">Jouer</button>';

}

function authFirstConnexion(pseudo, email, mdp){

  console.log(pseudo, email, mdp);
  paramFirst = "email_useritium="+email+"&mdp_useritium="+mdp+"&pseudo_tyroserv="+pseudo

    let myRequestFirst = new XMLHttpRequest();
    myRequestFirst.open('POST', 'http://useritium.fr/api-externe/index.php?controller=TyroServ&task=connect');
    myRequestFirst.onload = () => {

        console.log(myRequestFirst.responseText);
        var reponseFirst = JSON.parse(myRequestFirst.responseText);

        if(reponseFirst['status'] == "true"){
          
          messagePseudo = "Votre pseudo à bien été enregistrez"

          notif("true", messagePseudo);

          if(reponseFirst['why'] == "account created successfully"){
              
            var userTyroServLoadFirst = reponseFirst['result'];

            startMinecraft(userTyroServLoadFirst);

          } else {

              notif("err", "Veuillez rédémarré le launcher");

          }

        } else { notif(reponseFirst['status'], reponseFirst['why']); }

      };
    myRequestFirst.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    myRequestFirst.send(paramFirst);

}