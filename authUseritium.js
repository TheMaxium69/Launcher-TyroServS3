/**
 * USERITIUM X TYROSERV AUTH
 * @api : https://usertium.fr/api-externe/ 
 * @repo : https://github.com/TheMaxium69/ApiUsertium
 * 
 */


function authUseritium (email, mdp) {

    param = "email_useritium="+email+"&mdp_useritium="+mdp
    let uuid_tyroserv = "505874d8-f150-4685-add1-041453f6d713"



    let myRequest = new XMLHttpRequest();
    myRequest.open('POST', 'http://localhost/ApiUsertium-TyroServ/index.php?controller=TyroServ&task=connect');
    myRequest.onload = () => {

        var reponse = JSON.parse(myRequest.responseText);
        var userTyroServLoad = reponse['result'];

        console.log(reponse);

        ipc.send("login", {username_tyroserv: userTyroServLoad['pseudo'], uuid_tyroserv: uuid_tyroserv, token_tyroserv: userTyroServLoad['token'], token_tyroserv_a2f: userTyroServLoad['tokenTwo']})
    
      
      };
    myRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    myRequest.send(param);

}