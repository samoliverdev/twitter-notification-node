const cheerio = require('cheerio')
const notifier = require('node-notifier')
const fetch = require('node-fetch')
const fs = require('fs')

//////////////////////////////////////// Functions ///////////////////////////////////////////
function sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms))}

function getListFromScrapData(data){
    dataList = []
    data.each((i, e) => {
        dataList.push(data.eq(i).text())
    })

    return dataList
}

async function GetResponceFromUrl(url){
    const request = await fetch(url)
    const response = await request.text()
    return response
}

function getUrl(user){
	return `https://twitter.com/${user}`
}

function hasFixed(twitter){
    // console.log(twitter.parent().parent().find('.js-pinned-text').length)
    if(twitter.parent().parent().find('.js-pinned-text').length !== 0)
        return true

    return false
} 

function Setup(){
	const rawJson = fs.readFileSync('users.json')
	const users = JSON.parse(rawJson)

	const twitterData = []

	console.log('Users:')
    console.log('\n')
	users.users.forEach((user) => {
		console.log(user)
		twitterData.push({user: user, lastsTweet:'', allTwitters:[]})
	})

	return twitterData
}

async function twitterListen(twitterData) {
    while(true){
        try{
            for (var i = 0; i < twitterData.length; i++) {
                const response = await GetResponceFromUrl(getUrl(twitterData[i].user))

                const $ = cheerio.load(response);
                const scrapData = $('div.js-tweet-text-container p')

                let currentFirstTwitter = scrapData.eq(0).text()
                if(hasFixed(scrapData.eq(0).parent()))
                    currentFirstTwitter = scrapData.eq(1).text()


                if(twitterData[i].lastsTweet === ''){
                    const allTwitter = getListFromScrapData(scrapData)
                    allTwitter.forEach((m) =>{
                        twitterData[i].allTwitters.push(m)
                    })
                    twitterData[i].lastsTweet = currentFirstTwitter
                }else if(twitterData[i].lastsTweet != currentFirstTwitter && twitterData[i].allTwitters.includes(currentFirstTwitter) === false){
                    console.log(`New Twiter from ${twitterData[i].user}`,currentFirstTwitter)
                    console.log('\n')
                    twitterData[i].lastsTweet = currentFirstTwitter
                    twitterData[i].allTwitters.push(currentFirstTwitter)
                    twitterData[i].allTwitters.pop()
                    notifier.notify({title: `New Twiter from ${twitterData[i].user}`, message: currentFirstTwitter,sound: true}, (err, response) => {})
                }
            }
        }catch(err){
            console.log(err)
        }
        await sleep(2000)
    }
}

//////////////////////////////////////// Main ///////////////////////////////////////////

let twitterDat
try {
	twitterData = Setup()
}catch(err){
	console.log('Erro to Init')
	return
}

console.log('\nTwiter Listen Inited')
console.log('\n')
twitterListen(twitterData)