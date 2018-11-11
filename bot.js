const Discord = require('discord.js')
const client = new Discord.Client()
const request = require('request')
const urlencode = require('urlencode')
const lol_api = "RGAPI-a10538d1-fea8-4cbd-8204-5f323b6277de"
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


const urlchampid = "https://br1.api.riotgames.com/lol/static-data/v3/champions?locale=en_US&dataById=false&api_key=" + lol_api;
const urlitems = "https://br1.api.riotgames.com/lol/static-data/v3/items?locale=en_US&api_key=" + lol_api;
const urlitempicture = "http://ddragon.leagueoflegends.com/cdn/6.24.1/img/item/";
const urlsummonerid = "https://br1.api.riotgames.com/lol/summoner/v3/summoners/by-name/";
const urllivematch = "https://br1.api.riotgames.com/lol/spectator/v3/active-games/by-summoner/";
const urlgetchamp = "http://ddragon.leagueoflegends.com/cdn/6.24.1/data/en_US/champion.json";
const urlgetmastery = "https://br1.api.riotgames.com/lol/champion-mastery/v3/champion-masteries/by-summoner/";
const urlgetrank = "https://br1.api.riotgames.com/lol/league/v3/positions/by-summoner/";

client.on('ready', () => {
    console.log("Connected as " + client.user.tag)

    console.log("Servers:")
    client.guilds.forEach((guild) => {
        console.log(" - " + guild.name)

        // List all channels
        guild.channels.forEach((channel) => {
            console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
        })
    })

})

client.on('message', recievedMessage => {
	//Previne o bot de se auto-responder
	if(recievedMessage.author == client.user) {
		return
	}

	if(recievedMessage.content.startsWith("!")) {
		processCommand(recievedMessage)
	}

})

client.on('presenceUpdate', (oldMember, newMember) => {
	
	//console.log(newMember.presence.game)
	let guildChannels = newMember.guild.channels
	const generalChannel = client.channels.get("510979547781660694")
	let currentGame = newMember.presence.game

	if(currentGame != null && currentGame.toString() != "Spotify") {

		let userName = newMember.user.toString()
		generalChannel.send(userName + " está jogando " + currentGame.toString() + ", desejemos boa sorte!")

		if(currentGame.toString() === "Black Desert Online") {
			generalChannel.send("Bom grind " + userName + "!!")
		}
	}

})

client.on("guildMemberAdd", member => {
	const generalChannel = client.channels.get("510979547781660694")

	generalChannel.send("Olá " + member.user.toString() + ". Bem vindo ao servidor!")

})


function processCommand(recievedMessage) {

	let fullCommand = recievedMessage.content.substr(1)
	let splitCommand = fullCommand.split(" ")
	let primaryCommand = splitCommand[0]
	let arguments = splitCommand.slice(1)

	console.log("Commands recieved: " + primaryCommand)
	console.log("Arguments: " + arguments)

	if(primaryCommand === "ola") {
		const userAvatar = new Discord.RichEmbed().setImage(recievedMessage.author.avatarURL).setColor('275BF0')
		recievedMessage.channel.send("Olá " + recievedMessage.author.toString())
		recievedMessage.channel.send("Está jogando: " + recievedMessage.author.presence.game === null ? "Nada" : recievedMessage.author.presence.game.toString())

		if(recievedMessage.author.presence.game != null) {
			if(recievedMessage.author.presence.game.toString() === "Spotify") {
				recievedMessage.channel.send("Boa música estás a ouvir!")
			}
		}
	}

	if(primaryCommand === "lol") {
		

		const http = new XMLHttpRequest()
		const url = urlsummonerid.concat(arguments[0], "?api_key=", lol_api)
		http.open("GET", url);
		http.send();
		console.log(url)
		http.onreadystatechange=(e)=>{
			if (http.readyState == 4 && http.status == 200){

				console.log(http.responseText)
				let summoner = JSON.parse(http.responseText)
				console.log(summoner)


				const xhr = new XMLHttpRequest()
				const url2 = urlgetrank.concat(summoner.id, "?api_key=", lol_api)
				xhr.open("GET", url2, false);
				xhr.send(null);
				console.log(xhr.responseText)
				let summonerRank = JSON.parse(xhr.responseText)
				console.log(summonerRank)

				const profileURL = "http://br.op.gg/summoner/userName=".concat(summoner.name)

				let cont = Object.keys(summonerRank).length
				console.log(cont)


				if(cont === 2) {
					
					recievedMessage.channel.send(new Discord.RichEmbed()
						.setThumbnail(getElo(summonerRank[0].tier))
						.setTitle(summoner.name)
						.setColor('275BF0')
						.addField("Nível de Invocador:", summoner.summonerLevel)
						.addBlankField()
						.addField(summonerRank[0].queueType === "RANKED_SOLO_5x5" ? " **__SOLO/DUO stats:__**" : " **__FLEX stats:__**", ".....................................")
						.addField("Elo:", summonerRank[0].tier + " " + summonerRank[0].rank)
						.addField("PDL:", summonerRank[0].leaguePoints)
						.addField("Vitórias:", summonerRank[0].wins)
						.addField("Derrotas:", summonerRank[0].losses)
						.addField("Taxa de vitória:", ((summonerRank[0].wins/(summonerRank[0].wins + summonerRank[0].losses)) * 100).toFixed(2) + "%")
						.addBlankField()
						.addField((summonerRank[1].queueType === "RANKED_FLEX_SR" ? " **__FLEX stats:__**" : " **__SOLO/DUO stats:__**"), ".....................................")
						.addField("Elo:", summonerRank[1].tier + " " + summonerRank[1].rank)
						.addField("PDL:", summonerRank[1].leaguePoints)
						.addField("Vitórias:", summonerRank[1].wins)
						.addField("Derrotas:", summonerRank[1].losses)
						.addBlankField()
						.addField("Perfil OP.GG:", profileURL)
						)
				}	else if(cont === 1) {
					recievedMessage.channel.send(new Discord.RichEmbed()
						.setThumbnail(getElo(summonerRank[0].tier))
						.setTitle(summoner.name)
						.setColor('275BF0')
						.addField("Nível de Invocador:", summoner.summonerLevel)
						.addField(summonerRank[0].queueType === "RANKED_SOLO_5x5" ? " **__SOLO/DUO stats:__**" : " **__FLEX stats:__**", ".....................................")
						.addField("Elo:", summonerRank[0].tier + " " + summonerRank[0].rank)
						.addField("PDL:", summonerRank[0].leaguePoints)
						.addField("Vitórias:", summonerRank[0].wins)
						.addField("Derrotas:", summonerRank[0].losses)
						.addField("Taxa de vitória:", ((summonerRank[0].wins/(summonerRank[0].wins + summonerRank[0].losses)) * 100).toFixed(2) + "%")
						.addBlankField()
						.addField((summonerRank[0].queueType === "RANKED_FLEX_SR" ? " **__FLEX stats:__**" : " **__SOLO/DUO stats:__**"), "Not ranked")
						.addBlankField() 
						.addField("Perfil OP.GG:", profileURL)
						)
				} else {
					recievedMessage.channel.send(new Discord.RichEmbed()
						.setTitle(summoner.name)
						.setColor('275BF0')
						.addField("Nível de Invocador:", summoner.summonerLevel)
						.addField("**__SOLO/DUO stats:__**" , "Not ranked")						
						.addBlankField()
						.addField("**__FLEX stats:__**", "Not ranked")	
						.addBlankField()					
						.addField("Perfil OP.GG:", profileURL)
						)
				}
			}
		}



	}

}

function getElo(elo) {
	if(elo === "BRONZE") 		return "https://cdn.leagueofgraphs.com/img/league-icons/160/1-1.png"
	if(elo === "SILVER") 		return "https://cdn.leagueofgraphs.com/img/league-icons/160/2-1.png"
	if(elo === "GOLD") 			return "https://cdn.leagueofgraphs.com/img/league-icons/160/3-1.png"
	if(elo === "PLATINUM") 		return "https://cdn.leagueofgraphs.com/img/league-icons/160/4-1.png"
	if(elo === "DIAMOND") 		return "https://cdn.leagueofgraphs.com/img/league-icons/160/5-1.png"
	if(elo === "MASTER") 		return "https://cdn.leagueofgraphs.com/img/league-icons/160/6-1.png"
	if(elo === "CHALLENGER") 	return "https://cdn.leagueofgraphs.com/img/league-icons/160/7-1.png"
}


// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
bot_secret_token = "NTEwOTgwMDY4ODM1ODUyMjg4.DskPWw.nVNsY6SJtJY39mTFMogMK-JTHEE"

client.login(bot_secret_token)