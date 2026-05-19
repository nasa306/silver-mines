//-------------data------------//
let silver = 0;
let timecounter = 0;
let housecost = 20;
let eventActive = false;
let researchCost = 50;
let phase = 1;
let railroad = 0; // 0 = no railroad, 1 = railroad with company influence, -1 = railroad with local influence
let perspective = 0; // 0 = neutral, => company,  <= locals
const ownedMinesdisp = document.getElementById("ownedMines");
const eventpopup = document.getElementById("eventpopup");
const eventtext = document.getElementById("eventtext");
const eventbuttons = document.getElementById("eventbuttons");
const storydiv = document.getElementById("story");
const buttonsdiv = document.getElementById("buttons");
const silverdisp = document.getElementById("silver");
const populationdisp = document.getElementById("population");
const populationlimit = document.getElementById("populationLimit");
const daydisp = document.getElementById("day");
const idledisp = document.getElementById("idle");
const otheridledisp = document.getElementById("sameidlebutwontworkifireuseforsomereason");
const minerdisp = document.getElementById("miners");
const soldierdisp = document.getElementById("soldiers");
const logdiv = document.getElementById("log");
let population = 0, maxpopulation = 10, soldiers = 0, miners = 0, ownedMines = 1, day = 1;
let silverMultiplier = 1;
let safetyMultiplier = 1;
let settlerChanceMultiplier = 1;
let banditChanceMultiplier = 1;
let researchedTechs = [];
let unresearchedTechs = ["Patio Process", "Dynamite", "Stamp Mill", "Square Set Timbering", "Dynamite+", "Hydraulic Pumps", "Washoe Process", "Dynamite++"];
const storyData = {
    // test storyline
    start:{
        text:"start of game - test",
        choices:[
            {text:"Go to the mine", next:"mine", silver:10},
            {text:"Rest at home", next:"base"}
        ]
    },
    mine:{
        text:"You go to the mine and find some silver.",
        choices:[
            {text:"Go back home", next:"base"}
        ]
    },
    base:{
        text:"base",
        choices:[
            {text:"Build a house (" + housecost + " silver)", interaction:"housebuilding"},
            {text:"Research new techniques", interaction:"research"},
            {text:"Go mining", next:"mine", silver:10}
        ]
    },
    canbuildhouse:{
        text:"You built a house and increased your population limit.",
        choices:[
            {text:"Go back to base", next:"base"}
        ]
    },
    cannotbuildhouse:{
        text:"You don't have enough silver to build a house.",
        choices:[
            {text:"Go back to base", next:"base"}
        ]
    },
    ending:{
        text:"The end. Thanks for playing! this is filler text. Replace this with an actual ending based on the player's choices and perspective.",

    }
};
const interactions = {
    housebuilding: function() {
        if (silver >= housecost) {
            buildHouse();
            showNode("canbuildhouse");
            updateUI();
        } else {
            showNode("cannotbuildhouse");
        }
    },
    research: function() {
        if (silver >= researchCost) {
            updateSilver(0 - researchCost);
            researchedTechs.push(unresearchedTechs[0]);
            addLog("You researched " + unresearchedTechs[0] + "!");
            if (unresearchedTechs[0] === "Dynamite" || unresearchedTechs[0] === "Patio Process" || unresearchedTechs[0] === "Stamp Mill" || unresearchedTechs[0] === "Hydraulic Pumps") {
                silverMultiplier += 0.1;
            }
            if (unresearchedTechs[0] === "Square Set Timbering" || unresearchedTechs[0] === "Hydraulic Pumps") {
                safetyMultiplier -= 0.15;
            }
            if (unresearchedTechs[0] === "Dynamite+") {
                silverMultiplier += 0.2;
            }
            if (unresearchedTechs[0] === "Dynamite++" || unresearchedTechs[0] === "Washoe Process") {
                silverMultiplier += 0.3;
            }
            unresearchedTechs.shift();
            updateUI();
            researchCost = Math.floor(researchCost * 1.5);
            showNode("base");
        } else {
            addLog("You don't have enough silver to research.");
            showNode("base");
        }
    },
    minecollapseEvent: function() {
        const lostMiners = Math.min(miners, Math.floor(Math.random() * 3) + 1);
        miners -= lostMiners;
        population -= lostMiners;
        addLog("The mine collapsed! You lost " + lostMiners + " miners.");
        hideEvent();
        updateUI();
    },
    banditAttack: function() {
        let gainedSilver = -1;
        let lostPopulation = Math.min(population, Math.floor(Math.random() * 5) + 1);
        gainedSilver = lostPopulation * 5;
        for (let i = 0; i < soldiers; i++) {
            if (Math.random() < 0.5 + soldiers / (soldiers+10)) { 
                lostPopulation--;
            }
        }
        lostPopulation = Math.max(0, lostPopulation);
        population -= lostPopulation;
        let stolenSilver;
        if (lostPopulation < soldiers) {soldiers -= lostPopulation;  updateSilver(gainedSilver);}
        else {
            lostPopulation -= soldiers;
            soldiers = 0; 
            miners = Math.max(0, miners - lostPopulation);
            stolenSilver = Math.min(silver, lostPopulation * 5);
            updateSilver(0 - stolenSilver);
        }
        if (lostPopulation > 0) addLog("Bandits attacked your town! They stole " + stolenSilver + " silver and you lost " + lostPopulation + " people.");
        else addLog("Bandits attacked your town but your soldiers fought them off! You gained " + gainedSilver + " silver.");
        hideEvent();
        updateUI();
    },
    raidMineInteraction: function() {
        const successChance = 0.5 + soldiers / (soldiers + 10);
        let lostSoldiers = Math.min(soldiers, Math.floor(Math.random() * 3) + 1);
        if (Math.random() < successChance) {
            ownedMines++;
            lostSoldiers = Math.min(soldiers, 1 + Math.floor(Math.random() * 2));
            population -= lostSoldiers;
            soldiers -= lostSoldiers;
            addLog("You successfully raided the mine and now own " + ownedMines + " mines! However, you lost " + lostSoldiers + " soldiers in the process.");
        } else {
            soldiers -= lostSoldiers;
            population -= lostSoldiers;
            addLog("The raid failed! You lost " + lostSoldiers + " soldiers.");
        }
        hideEvent();
        updateUI();
    },
    railroadAccept: function() {
        railroad = 1;
        silverMultiplier += 0.25;
        maxpopulation += 10;
        settlerChanceMultiplier += 0.5;
        banditChanceMultiplier += 0.5;
        addLog("Railroad investors arrive and construction begins.");
        addLog("Trade increases as supplies flow into town.");
        hideEvent();
        updateUI();
    },

    railroadReject: function() {
        railroad = -1;
        safetyMultiplier -= 0.05;
        addLog("Town leaders reject outside railroad influence.");
        addLog("The settlement remains independent but grows more slowly.");
        hideEvent();
        updateUI();
    }
};
const interactionText = {
  housebuilding: function(){
      return "Build a house (" + housecost + " silver)";
  }  ,
  research: function() {
      return "Research new techniques (" + researchCost + " silver)";
  }
};
const eventsData = {
    // test events
    bandits:{
        text:"Bandits are attacking your town!",
        choices:[
            {text:"Continue", interaction:"banditAttack"}
        ]
    },
    minecollapse:{
        text:"The mine collapsed! You lost some miners.",
        choices:[
            {text:"Continue", interaction:"minecollapseEvent"}
        ]
    },
    raidMine:{
        text:"An abandoned mine was found nearby, but it's guarded by bandits. Do you want to raid it?",
        choices:[
            {text:"Yes", interaction:"raidMineInteraction"},
            {text:"No", next:"base"}
        ]
    },
    railroadArrives:{
        text: "Railroad companies offer to connect your settlement to major trade routes. Some citizens welcome economic growth, while others fear outside control.",
        choices: [
            {
                text: "Accept investment",
                interaction: "railroadAccept",
                perspective: "company"
            },
            {
                text: "Reject outside influence",
                interaction: "railroadReject",
                perspective: "locals"
            }
        ]
    }
}
console.log("test");
function updateSilver(amount){
    silver += amount;
    silverdisp.textContent = Math.floor(silver);
}
//----------primary source---------//
const primarypopup = document.getElementById("primarysourcepopup");
const primarytitle = document.getElementById("primarysourcetitle");
const primarytext = document.getElementById("primarysourcetext");
const primarybutton = document.getElementById("primarysourcebutton");

function showPrimarySource(title, text) {

    primarytitle.textContent = title;
    primarytext.textContent = text;

    primarypopup.style.display = "flex";
}

function hidePrimarySource() {
    primarypopup.style.display = "none";
}

primarybutton.onclick = hidePrimarySource;
//-------------events-------------//
function showEvent(eventName){
    const event = eventsData[eventName];
    eventActive = true;
    eventtext.textContent = event.text;
    eventbuttons.innerHTML = "";
    eventpopup.style.display = "flex";
    event.choices.forEach(element => {
        const button = document.createElement("button");
        button.textContent = element.text;
        eventbuttons.appendChild(button);
        button.onclick = () => {
            if (element.interaction){
                interactions[element.interaction](); 
            } else if (element.next){
                hideEvent();
                showNode(element.next);
            } 
            if (element.perspective) {
                if (element.perspective === "company") {
                    perspective += 1;
                } else if (element.perspective === "locals") {
                    perspective -= 1;
                }
            }
        }
    });
}
function hideEvent(){
    eventActive = false;
    eventpopup.style.display = "none";
}
function tryshowEvent(){
    if (!eventActive && Math.random() < 0.0008 * Math.sqrt(miners) / ownedMines * safetyMultiplier) {
        showEvent("minecollapse");
    } else if (!eventActive && Math.random() < 0.001 + Math.sqrt(silver) * 0.0001*banditChanceMultiplier) {
         showEvent("bandits");
    } else if (!eventActive && Math.random() < 0.0005 + day * 0.0002 && soldiers > 10) {
        showEvent("raidMine");
    }
    if (!eventActive && phase == 2 && Math.random() < 0.0005 && railroad == 0) {
        showEvent("railroadArrives");
    }
    if (!eventActive && phase == 3 && Math.random() < 0.0005) {
        showEvent("miningCompaniesArrive");
    }
}
//-------------log systems-------------//
let logQueue = [];
function queueLog(text, chance = 1) {
    if (Math.random() < chance) {
        logQueue.push(text);
    }
}
function processLogQueue() {
    while (logQueue.length > 0) {
        addLog(logQueue.shift());
    }
}
function passiveLogs() {
    if (Math.random() < 0.1) {
        if (miners > maxpopulation * 0.75) {
            queueLog("The mines are bustling with activity.", 0.1);
        } else if (miners > maxpopulation * 0.5) {
            queueLog("The mines are busy.", 0.1);
        } else if (miners > maxpopulation * 0.1) {
            queueLog("The mines are quiet.", 0.1);
        }
        if (soldiers > maxpopulation * 0.25) {
            queueLog("Your soldiers are keeping the town safe.", 0.1);
        } else if (soldiers > maxpopulation * 0.1) {
            queueLog("Your soldiers are on patrol.", 0.1);
        } else if (soldiers > 0) {
            queueLog("Your soldiers have too much on their plate.", 0.1);
        }

        // Phase-based logs
        if (phase === 1 && population > 10 && Math.random() < 0.05){
            queueLog("The town is starting to grow.", 0.5);
        }
        if (phase == 1 && Math.random() < 0.05){
            queueLog("Rumors of silver spread east.", 0.5);
        } else if (phase == 1 && Math.random() < 0.05){
            queueLog("Prospectors arrive in small numbers.", 0.5);
        }
        if (phase == 2 && Math.random() < 0.05){
            queueLog("The settlement grows rapidly.", 0.5);
        } else if (phase == 2 && Math.random() < 0.05){
            queueLog("Merchants and gamblers arrive, bringing trade and excitement.", 0.5);

        }
        //Railroad based logs
        if (railroad == 1 && Math.random() < 0.05) {
            queueLog("Railroad shipments bring new goods and workers.", 0.5);
        }

        if (railroad == 1 && Math.random() < 0.05) {
            queueLog("Large mining companies begin investing nearby.", 0.5);
        }

        if (railroad == -1 && Math.random() < 0.05) {
            queueLog("Some citizens are proud of the town's independence.", 0.5);
        }

        if (railroad == -1 && Math.random() < 0.05) {
            queueLog("Merchants complain about difficult travel routes.", 0.5);
        }
    }
}
function addLog(text) {
    const line = document.createElement("div");
    line.textContent = text;
    const sep = document.createElement("div");
    sep.textContent = "-------------";

    logdiv.prepend(sep);
    logdiv.prepend(line);
    

}
//-------------story-------------//
function showNode(nodeName){
    const node = storyData[nodeName];

    storydiv.textContent = node.text;
    buttonsdiv.innerHTML = "";
    node.choices.forEach(choice => {
        const button = document.createElement("button");
        button.textContent = choice.text;
        if (choice.interaction){
            button.textContent = interactionText[choice.interaction]();
        }
        button.onclick = () => {
            if (choice.silver) {
                updateSilver(choice.silver);
            }
            if (choice.next){
                showNode(choice.next);
            }
            if (choice.interaction){
                interactions[choice.interaction]();  // Call the function directly instead of using eval()
            }
        };
        buttonsdiv.appendChild(button);
    });
}
function updatePhase(){
    if (population > 25 && phase == 1) phase = 2;
    if (phase == 2 && ownedMines > 3) phase = 3;
}
//-------------population------------//
function getIdle(){
    return population - miners - soldiers;
}
function addMiner(){
    if (getIdle() > 0){
        miners++;
        updateUI();
    }
}
function addSoldier(){
    if (getIdle() > 0){
        soldiers++;
        updateUI();
    }
}
function unassignMiner(){
    if (miners > 0){
        miners--;
        updateUI();
    }
}
function unassignSoldier(){
    if (soldiers > 0){
        soldiers--;
        updateUI();
    }
}
function buildHouse(){
    if (silver >= housecost){
        maxpopulation += 4;
        updateSilver(0-housecost);
        housecost = Math.floor(housecost * 1.25);
        let houses = ["A new house was built.", "You built a house.", "Your town expands with a new house.", "A new home is constructed.", "🛖", "🏠", "🏘️","🏚️","🏡"];
        addLog(houses[Math.floor(Math.random() * houses.length)]);
        updateUI();
    }
}
function forcesettlers(amount){
    population += amount;
    if (population > maxpopulation){
        population = maxpopulation;
        for (let i = 0; i < amount; i++) {
            addLog("A person joined your town.");
        }
    }
}
function tryAddSettler() {
    if (population < maxpopulation) {
        if (Math.random() < (maxpopulation - population) * 0.01 * settlerChanceMultiplier) { 
            population++;
            addLog("A person joined your town.");
        }
    }
}
function updateUI(){
    silverdisp.textContent = Math.floor(silver);
    populationdisp.textContent = population;
    populationlimit.textContent = maxpopulation;
    daydisp.textContent = day;
    ownedMinesdisp.textContent = ownedMines;
    soldierdisp.textContent = soldiers;
    minerdisp.textContent = miners;
    idledisp.textContent = getIdle();
    otheridledisp.textContent = getIdle();
}

//-------------loop------------//
showPrimarySource(
    "United Times — June 1861",

    `Silver discoveries in the western territories continue to attract prospectors from across the nation.

    Nobody knows how much silver lies beneath the surface, but the rush is on as more and more people stake their claims.

Some even believe the region may soon rival California itself.`
);
function gameLoop(){
    if (eventpopup.style.display == "flex") return;
    silver += Math.min(miners, ownedMines * 5) * 0.3 * silverMultiplier;
    timecounter++;
    if (timecounter % 60 == 0) {
        day++;
        
        silver -= Math.floor(soldiers * 0.5);
    }
    passiveLogs();
    processLogQueue();
    tryAddSettler();
    tryshowEvent();
    updateUI();
}
function showEnding(){
   if (perspective >= 2){
        showPrimarySource("Nevada Mining Review — October 1875",
            `The arrival of the railroads transformed the region into a center of industrial prosperity. Investors and mining companies brought employment, modern equipment, and national importance to what was once an isolated frontier. 

            However, many small miners lost their claims. The town grows larger every year, though fewer people truly control their own future."`);
    } else if (perspective <= -2){
        showPrimarySource("The Independent Gazette — October 1875",
            `The people of the Nevada silver camps resisted outside control and preserved the independence of their town. Local miners and merchants continued to manage their own affairs rather than surrendering authority to distant railroad companies and investors.

            Though growth came more slowly, many citizens believed the community kept its freedom, traditions, and sense of fairness. Critics argued that the region missed opportunities for greater wealth and expansion, but supporters claimed the town belonged to its people rather than powerful corporations.`);
    } else {
        showPrimarySource("Travel Journal — 1875",
            `The silver towns of Nevada are filled with both opportunity and hardship. Wealth moves through the region quickly, but so do danger, speculation, and uncertainty.`);
    }
    showNode("ending");

}

showNode("start");
setInterval(gameLoop, 1000);
