import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// ── Question Bank ──────────────────────────────────────────────────────────────
const ALL_QUESTIONS = [
  { id:1,  type:"filmed", emoji:"🎬", clue:"The helicopter opening of this Kubrick horror film follows a yellow VW Beetle winding through switchbacks in the Rocky Mountains to a remote hotel", answer:"Estes Park, Colorado", blurb:"The Stanley Hotel in Estes Park inspired Stephen King's novel after a nightmarish stay. Kubrick built all interior sets on a Burbank soundstage but used the hotel's dramatic exterior for every outside shot.", lat:40.3772, lng:-105.5217 },
  { id:2,  type:"filmed", emoji:"🎬", clue:"Ridley Scott chose this North African country's ancient ruins and salt flats to double for the Roman Colosseum era in his 2000 swords-and-sandals epic", answer:"Ouarzazate, Morocco", blurb:"Gladiator filmed its gladiatorial scenes at Ouarzazate, a desert city called the 'door of the desert' that has hosted hundreds of productions including Lawrence of Arabia and Game of Thrones.", lat:30.9189, lng:-6.8936 },
  { id:3,  type:"filmed", emoji:"🎬", clue:"Peter Jackson filmed 150 locations across this island nation over 438 days, transforming its geography into an entire fantasy world", answer:"New Zealand", blurb:"The Lord of the Rings trilogy permanently reshaped New Zealand's identity. Hobbiton in Matamata became a permanent attraction; the country's national airline still paints planes with Middle-earth livery.", lat:-40.9006, lng:174.8860 },
  { id:4,  type:"filmed", emoji:"🎬", clue:"The opening beach assault in this Spielberg WWII epic was shot on an Atlantic stretch of European coastline normally used for family holidays", answer:"County Wexford, Ireland", blurb:"Curracloe Beach in County Wexford doubled as Omaha Beach in Saving Private Ryan. The real Normandy beaches were considered too developed. Over 1,000 Irish Army reservists served as extras.", lat:52.3969, lng:-6.3794 },
  { id:5,  type:"filmed", emoji:"🎬", clue:"Denis Villeneuve chose this UAE desert's towering orange dunes over Jordan for their more alien scale when filming his 2021 sci-fi epic about a desert planet", answer:"Abu Dhabi, UAE", blurb:"The Liwa Desert near Abu Dhabi, with some of the world's tallest dunes, became the planet Arrakis in Dune. The production endured temperatures exceeding 45°C during filming.", lat:23.4241, lng:53.8478 },
  { id:6,  type:"filmed", emoji:"🎬", clue:"Francis Ford Coppola's Vietnam epic took 238 days in this Southeast Asian country instead of the planned 17, after typhoons destroyed sets and a leading man had a heart attack on set", answer:"Philippines", blurb:"Apocalypse Now filmed on Luzon. Philippine President Marcos loaned military helicopters that were periodically recalled mid-shoot for actual combat operations against insurgents.", lat:15.8700, lng:100.9925 },
  { id:7,  type:"filmed", emoji:"🎬", clue:"Christopher Nolan used this Midwest metropolis so extensively for his superhero trilogy that Gotham City became essentially indistinguishable from it", answer:"Chicago, Illinois", blurb:"Lower Wacker Drive, Chicago City Hall, and the elevated L train all appear prominently in The Dark Knight. Nolan chose Chicago for its rare mix of Gothic and modernist architecture.", lat:41.8781, lng:-87.6298 },
  { id:8,  type:"filmed", emoji:"🎬", clue:"The sandstone valley where T.E. Lawrence's actual campaigns took place was used for the sweeping desert panoramas in the 1962 epic about his life", answer:"Wadi Rum, Jordan", blurb:"Wadi Rum, the Valley of the Moon, remains one of the most filmed locations on Earth. The Mars-like landscape later appeared in The Martian, Rogue One, and Dune Part Two.", lat:29.5731, lng:35.4125 },
  { id:9,  type:"filmed", emoji:"🎬", clue:"George Miller planned to film his post-apocalyptic 2015 car-chase epic in Australia but record rains turned the outback green, forcing a move to this African desert", answer:"Namibia", blurb:"Mad Max: Fury Road filmed in the Namib Desert's Dorob National Park for over 100 days. The orange dunes near Swakopmund became the iconic wasteland. The production lasted so long that cast members learned Namibian languages.", lat:-22.9576, lng:14.5085 },
  { id:10, type:"filmed", emoji:"🎬", clue:"Despite being set in Scotland, most of this 1995 Mel Gibson epic was filmed across the border, though one glen provided the iconic highland battle sequences", answer:"Glen Nevis, Scotland", blurb:"Braveheart used Irish extras for large battle sequences but filmed its iconic highland vistas at Glen Nevis near Fort William. Much of the film was shot in Ireland due to budget constraints.", lat:56.7979, lng:-5.0040 },
  { id:11, type:"filmed", emoji:"🎬", clue:"This Hawaiian island's rugged northern coastline and botanical gardens stood in for the fictional dinosaur island in Spielberg's 1993 blockbuster", answer:"Kauai, Hawaii", blurb:"Kauai has appeared in more Hollywood films per square mile than almost anywhere on Earth. The Manawaiopuna Falls, nicknamed Jurassic Falls, can only be reached by helicopter today.", lat:22.0964, lng:-159.5261 },
  { id:12, type:"filmed", emoji:"🎬", clue:"Sergio Leone filmed the sweeping duel sequences of his spaghetti westerns in this Spanish desert region that doubled as the American frontier", answer:"Almería, Spain", blurb:"The Tabernas Desert in Almería is Europe's only true semi-arid desert. Leone's Dollar Trilogy put it on the map and it still operates as Mini Hollywood, a western theme park drawing tourists.", lat:37.0532, lng:-2.3642 },
  { id:13, type:"filmed", emoji:"🎬", clue:"The medieval walled city used as the capital of the Seven Kingdoms in HBO's fantasy epic imposed tourist limits after fans overwhelmed its ancient streets", answer:"Dubrovnik, Croatia", blurb:"Dubrovnik's limestone walls and terracotta rooftops were so perfect for King's Landing that the city now caps daily visitor numbers. The walls themselves appear in the show's opening credits.", lat:42.6507, lng:18.0944 },
  { id:14, type:"filmed", emoji:"🎬", clue:"The volcanic black sand beaches and ice caves of this Nordic island were used to represent the frozen lands Beyond the Wall in HBO's fantasy epic", answer:"Iceland", blurb:"Iceland's diverse landscape — glaciers, lava fields, and geysers — provided Game of Thrones with locations beyond the Wall across eight seasons. The production became one of Iceland's largest economic contributors.", lat:64.9631, lng:-19.0208 },
  { id:15, type:"filmed", emoji:"🎬", clue:"The prison where a wrongly convicted man dreams of escape in a beloved 1994 adaptation is a real Victorian-era reformatory in the American Midwest that now offers ghost tours", answer:"Mansfield, Ohio", blurb:"The Shawshank Redemption filmed at the Ohio State Reformatory in Mansfield, built in 1886 in Romanesque Revival style. The building was slated for demolition until the film's enduring popularity saved it.", lat:40.7662, lng:-82.5190 },
  { id:16, type:"filmed", emoji:"🎬", clue:"Quentin Tarantino's 1994 crime film opens in a diner in a specific Los Angeles suburb before unspooling its nonlinear story of hitmen and a briefcase", answer:"Hawthorne, California", blurb:"The opening diner in Pulp Fiction was Hawthorne Grill, demolished after the film. Tarantino grew up in nearby Torrance and set most of his early films in the Los Angeles basin.", lat:33.9164, lng:-118.3526 },
  { id:17, type:"filmed", emoji:"🎬", clue:"The Normandy landing recreation for a Spielberg war epic was filmed on a specific stretch of Irish Atlantic coastline, not in France", answer:"County Wexford, Ireland", blurb:"Curracloe Beach in Wexford stood in for Omaha Beach. Spielberg could not use the real Normandy beaches because decades of development had destroyed the period look.", lat:52.3969, lng:-6.3794 },
  { id:18, type:"filmed", emoji:"🎬", clue:"The active volcano used to represent the fires of Mount Doom in Peter Jackson's final trilogy installment last erupted in 2007", answer:"Mount Ngauruhoe, New Zealand", blurb:"Ngauruhoe, a sacred Māori site, served as Mount Doom. Jackson was not permitted to film directly on the cone itself, so camera angles were carefully chosen to obscure its true base.", lat:-39.1571, lng:175.6321 },
  { id:19, type:"filmed", emoji:"🎬", clue:"The Amalfi Coast clifftop village of Ravello inspired the fictional Italian hillside where Michael Corleone hides in the first Godfather film, though the actual filming was further south", answer:"Sicily, Italy", blurb:"Coppola filmed the Sicilian sequences in Savoca and Forza d'Agrò in Sicily. The Bar Vitelli in Savoca, where Michael meets Apollonia's father, still draws Godfather fans from around the world.", lat:37.9755, lng:15.2683 },
  { id:20, type:"filmed", emoji:"🎬", clue:"Stanley Kubrick filmed his 1968 sci-fi masterpiece almost entirely at a single studio complex in this English county while never leaving the UK again for any production", answer:"Borehamwood, England", blurb:"2001: A Space Odyssey was shot at MGM-British Studios in Borehamwood, Hertfordshire. Kubrick spent 18 months there, pioneering front projection and other techniques that defined sci-fi cinema.", lat:51.6566, lng:-0.2724 },

  // ── SET ─────────────────────────────────────────────────────────────────────
  { id:21, type:"set", emoji:"📍", clue:"Walter White transforms from chemistry teacher to drug kingpin across the mesas and strip malls of this Southwestern city, where tourism jumped 10% after the show aired", answer:"Albuquerque, New Mexico", blurb:"Breaking Bad's Albuquerque was so vividly depicted that fans still make pilgrimages to the White house, the car wash, and the laundromat. The city leaned into it with official filming tours.", lat:35.0844, lng:-106.6504 },
  { id:22, type:"set", emoji:"📍", clue:"Tony Soprano runs his crime family from a specific quiet New Jersey suburb, and his actual on-screen house sold for $1 million in 2019 partly on the strength of its pop culture fame", answer:"North Caldwell, New Jersey", blurb:"The Soprano house at 14 Aspen Drive in North Caldwell still draws fans despite being a private residence. The show filmed at real locations across New Jersey, including a strip club in Lodi.", lat:40.8626, lng:-74.2760 },
  { id:23, type:"set", emoji:"📍", clue:"David Simon's crime drama set in this mid-Atlantic port city is considered the most accurately depicted urban environment in TV history — Simon covered it as a newspaper reporter for 12 years", answer:"Baltimore, Maryland", blurb:"The Wire filmed in real Baltimore neighborhoods with many locals as extras. Simon insisted on authenticity so deeply that he brought in former drug dealers and cops as writers and consultants.", lat:39.2904, lng:-76.6122 },
  { id:24, type:"set", emoji:"📍", clue:"The Dutton ranch empire sits in the sweeping river valleys of this state, whose property values surged dramatically after viewers fell in love with its landscape", answer:"Montana", blurb:"Yellowstone's success drove Montana ranch prices up sharply. Properties near Paradise Valley saw values surge as wealthy buyers chased the lifestyle depicted in the show.", lat:45.6770, lng:-110.5624 },
  { id:25, type:"set", emoji:"📍", clue:"The Byrde family launders cartel money through lakefront businesses in this real Missouri resort region known for its 1,150-mile shoreline", answer:"Lake of the Ozarks, Missouri", blurb:"The Lake of the Ozarks is a massive reservoir created by damming the Osage River in 1931. Locals say Ozark's portrayal of its lawless reputation isn't entirely off base.", lat:38.1742, lng:-92.6824 },
  { id:26, type:"set", emoji:"📍", clue:"Season 1 of this anthology crime drama unravels across the flat, eerie coastline of a Southern state slowly being swallowed by the Gulf of Mexico", answer:"Louisiana", blurb:"True Detective's coastal Louisiana — its abandoned churches, rusting oil infrastructure, and disappearing marshland — became as central a character as Rust Cohle himself.", lat:29.9511, lng:-90.0715 },
  { id:27, type:"set", emoji:"📍", clue:"The illegal gold rush settlement where Wild Bill Hickok was shot dead in 1876 serves as the setting for this HBO western about lawlessness, commerce, and civilization", answer:"Deadwood, South Dakota", blurb:"The real Deadwood was an illegal settlement on Lakota Sioux treaty land. The real murder trial of Jack McCall after Hickok's death is considered one of the most chaotic legal proceedings in American history.", lat:44.3767, lng:-103.7296 },
  { id:28, type:"set", emoji:"📍", clue:"The fictional Dunder Mifflin paper company's most famous branch is set in a postindustrial city in northeastern Pennsylvania that has seen tourism rise because of the show", answer:"Scranton, Pennsylvania", blurb:"The Office filmed in Los Angeles but set every episode in Scranton. The real city embraced its fictional fame — the city hosts an annual Dundies ceremony and The Electric City has Office-themed walking tours.", lat:41.4090, lng:-75.6624 },
  { id:29, type:"set", emoji:"📍", clue:"Eleven escapes from a secret government lab and stumbles into a fictional Indiana town where friends investigate supernatural forces in this hit Netflix drama", answer:"Hawkins, Indiana", blurb:"Stranger Things' Hawkins is fictional but films primarily in and around Atlanta. The Hawkins National Laboratory was filmed at the former Georgia Mental Health Institute.", lat:39.7910, lng:-86.1480 },
  { id:30, type:"set", emoji:"📍", clue:"The fictional Springfield where a yellow animated family has lived since 1989 was deliberately kept in an unnamed state, though the creator eventually confirmed the real inspiration", answer:"Springfield, Oregon", blurb:"Matt Groening confirmed Springfield is based on Springfield, Oregon, his home state. He kept it deliberately ambiguous for decades so every American viewer could imagine it was near them.", lat:44.0462, lng:-123.0220 },
  { id:31, type:"set", emoji:"📍", clue:"Carrie Bradshaw writes her column about sex and relationships while navigating the Upper East Side and Midtown of this city, whose West Village stoop became a major tourist stop", answer:"New York City, New York", blurb:"The real stoop used for Carrie's apartment building is on Perry Street in the West Village. The owners eventually had to restrict access as tourists crowded the entrance at all hours.", lat:40.7128, lng:-74.0060 },
  { id:32, type:"set", emoji:"📍", clue:"Don Draper and the Sterling Cooper ad men work on Madison Avenue during the 1960s selling the American dream, with their Manhattan office recreated entirely on a Los Angeles soundstage", answer:"New York City, New York", blurb:"Mad Men's meticulous period recreation was so accurate that the show's set decorator employed a full-time historian. Creator Matthew Weiner required every visible prop to be verifiably period-correct.", lat:40.7549, lng:-73.9840 },
  { id:33, type:"set", emoji:"📍", clue:"Rocky Balboa trains by running up the steps of a famous art museum in his blue-collar hometown, where a bronze statue of the fictional boxer now stands as one of the city's most visited landmarks", answer:"Philadelphia, Pennsylvania", blurb:"The Philadelphia Museum of Art steps are officially called the Rocky Steps. The bronze statue was originally a prop for Rocky III, donated to the city by Sylvester Stallone after filming.", lat:39.9526, lng:-75.1652 },
  { id:34, type:"set", emoji:"📍", clue:"Tony Montana rises from a refugee processing center to cocaine kingpin in this Florida coastal city, burning through wealth as spectacularly as he accumulated it", answer:"Miami, Florida", blurb:"Scarface filmed primarily in Miami Beach and Los Angeles. The Fontainebleau Hotel and various Art Deco locations appear throughout. Director Brian De Palma drew from the real Cuban Mariel boatlift of 1980.", lat:25.7617, lng:-80.1918 },
  { id:35, type:"set", emoji:"📍", clue:"The Corleone family's ancestral village, referenced throughout a celebrated crime trilogy, is a real hilltop town in the Palermo province with a long documented Mafia history", answer:"Corleone, Sicily", blurb:"Corleone is a real Sicilian town of about 11,000 people whose name became synonymous with organized crime. Mario Puzo chose it from a map; he had never visited when he wrote the novel.", lat:37.8133, lng:13.3057 },

  // ── ACTOR BIRTHPLACES ────────────────────────────────────────────────────────
  { id:36, type:"actor", emoji:"⭐", clue:"This Oscar-winning actress grew up on a farm in the highveld east of a major South African city before witnessing a traumatic event at 15 that led her to leave for New York to model", answer:"Benoni, South Africa", blurb:"Charlize Theron was raised in Benoni, a gold-mining town east of Johannesburg. She arrived in New York with little money and was discovered in a bank argument by an acting agent.", lat:-26.1886, lng:28.3201 },
  { id:37, type:"actor", emoji:"⭐", clue:"This Welsh actor came from the same small steel-industry coastal town as Richard Burton — two of his country's most celebrated performers from one unlikely industrial place", answer:"Port Talbot, Wales", blurb:"Anthony Hopkins and Richard Burton both hail from Port Talbot, defined by its massive steelworks. Hopkins has said Burton was a formative inspiration who showed him that a working-class Welsh boy could conquer Hollywood.", lat:51.5908, lng:-3.7877 },
  { id:38, type:"actor", emoji:"⭐", clue:"This actress attended a quiet New Jersey commuter town high school, 24 miles from Manhattan, before studying at two elite universities and becoming the most Oscar-nominated performer of all time", answer:"Summit, New Jersey", blurb:"Meryl Streep grew up in Summit, New Jersey, attended Vassar College then Yale School of Drama. She received her 21st Oscar nomination in 2023, a record unmatched in Academy history.", lat:40.7151, lng:-74.3604 },
  { id:39, type:"actor", emoji:"⭐", clue:"Born in a working-class city directly bordering the Bronx, this actor attended college on an athletic scholarship before discovering drama and becoming one of the most acclaimed performers of his generation", answer:"Mount Vernon, New York", blurb:"Denzel Washington grew up in Mount Vernon and attended Fordham University. He discovered acting almost by accident at a YMCA camp and went on to become only the second Black man to win two acting Oscars.", lat:40.9126, lng:-73.8371 },
  { id:40, type:"actor", emoji:"⭐", clue:"This Australian actress studied economics briefly in her home city before switching to drama at a national arts institute and becoming one of the most versatile performers working today", answer:"Melbourne, Australia", blurb:"Cate Blanchett attended the National Institute of Dramatic Art in Sydney after initially studying economics and fine arts in Melbourne. She is one of the few actors to win Oscars in both lead and supporting categories.", lat:-37.8136, lng:144.9631 },
  { id:41, type:"actor", emoji:"⭐", clue:"This Oscar winner was born in a Latin American capital while her father, a prominent opposition politician, was living in political exile from his home country", answer:"Mexico City, Mexico", blurb:"Lupita Nyong'o was born in Mexico City while her father Peter fled Kenya's political violence. The family eventually returned to Nairobi, and she later attended Yale School of Drama.", lat:19.4326, lng:-99.1332 },
  { id:42, type:"actor", emoji:"⭐", clue:"This Spanish actor was born into a legendary Canary Island acting dynasty — his mother, uncle, and grandfather were all prominent Spanish film performers before him", answer:"Las Palmas, Gran Canaria", blurb:"Javier Bardem was born on Gran Canaria into one of Spain's most celebrated acting families. His brother Carlos and sister Mónica are also professional actors.", lat:28.1235, lng:-15.4363 },
  { id:43, type:"actor", emoji:"⭐", clue:"This star left his Midwestern university just two credits short of graduating and drove to Los Angeles in 1986 with little money to pursue acting", answer:"Springfield, Missouri", blurb:"Brad Pitt grew up in Springfield, Missouri and left the University of Missouri weeks before graduating to head to Hollywood. He was delivering refrigerators and driving a limousine while going to auditions.", lat:37.2090, lng:-93.2923 },
  { id:44, type:"actor", emoji:"⭐", clue:"Born in a US Caribbean territory while his parents traveled with a religious organization, this intense performer later changed his birth name and became one of Hollywood's most celebrated actors", answer:"San Juan, Puerto Rico", blurb:"Joaquin Phoenix was born in San Juan while his parents were members of the Children of God. The family later settled in Los Angeles where all five siblings pursued careers in entertainment.", lat:18.4655, lng:-66.1057 },
  { id:45, type:"actor", emoji:"⭐", clue:"This Oscar-winning actress was born in a small South Carolina town but grew up in extreme poverty in a New England state after her family relocated north when she was young", answer:"St. Matthews, South Carolina", blurb:"Viola Davis was born in St. Matthews, South Carolina but raised in Central Falls, Rhode Island in conditions she has described as among the most impoverished in the country. Her memoir Finding Me chronicles her journey.", lat:33.6629, lng:-80.7748 },
  { id:46, type:"actor", emoji:"⭐", clue:"This Australian actor grew up in a leafy North Shore suburb of his home city and was spotted in a local soap opera before Hollywood called with a role he would play for 25 years", answer:"Sydney, Australia", blurb:"Hugh Jackman grew up in Pymble on Sydney's North Shore and appeared in the Australian TV series Correlli before landing Wolverine. He has played the character across more films than any other superhero actor.", lat:-33.8688, lng:151.2093 },
  { id:47, type:"actor", emoji:"⭐", clue:"This British actress was raised in a home county west of London, trained at a renowned drama school, and became the youngest person to receive two Oscar nominations at the time of her first", answer:"Reading, England", blurb:"Kate Winslet was born in Reading, Berkshire and trained at Redroofs Theatre School. Her first nomination came at 22 for Titanic, making her the youngest double Oscar nominee in history at the time.", lat:51.4543, lng:-0.9781 },
  { id:48, type:"actor", emoji:"⭐", clue:"This actor grew up in Cambridge, Massachusetts, co-wrote his breakthrough script with his childhood neighbor, and sold it for around $600,000 after years of rejection", answer:"Cambridge, Massachusetts", blurb:"Matt Damon grew up in Cambridge and wrote Good Will Hunting with Ben Affleck, who lived nearby. The script passed through dozens of production companies before being bought by Miramax.", lat:42.3736, lng:-71.1097 },
  { id:49, type:"actor", emoji:"⭐", clue:"This Italian director was born in Rome and became synonymous with a genre of stylized crime and western films that directly influenced Tarantino, Scorsese, and a generation of filmmakers", answer:"Rome, Italy", blurb:"Sergio Leone was born in Rome to a pioneer of Italian silent cinema. His Once Upon a Time in America is considered one of the greatest crime films ever made and runs over four hours in its complete cut.", lat:41.9028, lng:12.4964 },
  { id:50, type:"actor", emoji:"⭐", clue:"This comedian and filmmaker was born in the Bronx, raised in Brooklyn's Flatbush neighborhood, and began selling jokes to columnists professionally at the age of 15", answer:"Brooklyn, New York", blurb:"Woody Allen was born in the Bronx as Allen Konigsberg and raised in Flatbush, Brooklyn. He became one of the most decorated filmmakers in history despite rarely leaving New York to shoot.", lat:40.6501, lng:-73.9496 },
  { id:51, type:"actor", emoji:"⭐", clue:"This actress was raised in the San Fernando Valley, began appearing in TV commercials at age 3, and attended Yale while at the height of her teenage Hollywood fame", answer:"Los Angeles, California", blurb:"Jodie Foster grew up in the San Fernando Valley and began her career in Coppertone sunscreen commercials. She earned a degree in literature from Yale while still a working actress.", lat:34.1808, lng:-118.3090 },
  { id:52, type:"actor", emoji:"⭐", clue:"This French actress was born in Paris and became the defining face of French cinema internationally, appearing in over 100 films across six decades", answer:"Paris, France", blurb:"Catherine Deneuve was born in Paris and remains the most internationally recognizable French actress in history. Her image was used as the model for Marianne, the symbol of the French Republic.", lat:48.8566, lng:2.3522 },
  { id:53, type:"actor", emoji:"⭐", clue:"This South Korean actor was born in Seoul, immigrated to Detroit as a child, and received an Oscar nomination for a film partly set in his homeland about immigrant family life", answer:"Seoul, South Korea", blurb:"Steven Yeun was born in Seoul and moved to Detroit as a young child. He received his Oscar nomination for Minari, about a Korean-American family's move to rural Arkansas in the 1980s.", lat:37.5665, lng:126.9780 },
  { id:54, type:"actor", emoji:"⭐", clue:"This character actor was born in a small Texas oil town, raised across several states after family upheaval, and became one of the most recognizable faces in American film and TV", answer:"Midland, Texas", blurb:"Woody Harrelson was born in Midland, Texas. His father Charles Harrelson was convicted of murder when Woody was a teenager, something he rarely discusses publicly.", lat:31.9974, lng:-102.0779 },
  { id:55, type:"actor", emoji:"⭐", clue:"This director grew up in a New Jersey suburb, was rejected by two film schools before being admitted as a TV major, and went on to become the highest-grossing director of his era", answer:"Haddonfield, New Jersey", blurb:"Steven Spielberg grew up partly in New Jersey and was rejected by USC film school twice. He eventually dropped out of Cal State Long Beach after Universal Pictures offered him a directing contract.", lat:39.8951, lng:-75.0355 },

  // ── CHARACTER / SCENE LOCATIONS ──────────────────────────────────────────────
  { id:56, type:"set", emoji:"🎭", clue:"Sherlock Holmes lived at the most famous fictional address in this city, on a street that now has an actual museum in the detective's honor despite him being entirely invented", answer:"London, England", blurb:"221B Baker Street now houses the Sherlock Holmes Museum. When Conan Doyle wrote the stories, Baker Street didn't extend to number 221, making the address entirely fictional.", lat:51.5237, lng:-0.1585 },
  { id:57, type:"set", emoji:"🎭", clue:"Dracula's castle, as described by Bram Stoker, is based on a real fortress perched on a cliff in the Carpathian Mountains of this Eastern European country", answer:"Transylvania, Romania", blurb:"Bran Castle in Transylvania is marketed as Dracula's castle, though Stoker likely never visited Romania. He reportedly found his inspiration in travel books he read at the British Museum.", lat:45.5151, lng:25.3673 },
  { id:58, type:"set", emoji:"🎭", clue:"Jay Gatsby throws his legendary parties at a mansion on the less fashionable side of a Long Island bay, described in the novel as separated from old money by the color of a dock light", answer:"Long Island, New York", blurb:"Fitzgerald based East and West Egg on the Gold Coast of Long Island's North Shore, specifically the villages of Sands Point and Kings Point, where he lived briefly in the 1920s.", lat:40.8510, lng:-73.7078 },
  { id:59, type:"set", emoji:"🎭", clue:"Hannibal Lecter was born into an aristocratic family in this Baltic country before wartime trauma and eventual emigration shaped him into fiction's most celebrated villain", answer:"Lithuania", blurb:"Thomas Harris established in Hannibal Rising that Lecter was born in Lithuania in the 1930s. Harris chose the country specifically for its history of occupation and wartime atrocities.", lat:55.1694, lng:23.8813 },
  { id:60, type:"set", emoji:"🎭", clue:"Indiana Jones teaches archaeology at a fictional New England university heavily modeled after an Ivy League school whose campus architecture inspired the production designers", answer:"Connecticut", blurb:"Marshall College is fictional but draws heavily from Yale University in New Haven, Connecticut. The campus's Gothic architecture and reputation for archaeology made it the obvious model.", lat:41.3083, lng:-72.9279 },

  // ── GEO FACTS ────────────────────────────────────────────────────────────────
  { id:61, type:"set", emoji:"🌍", clue:"The prime meridian — longitude zero — passes through the courtyard of a royal observatory in this London suburb, dividing the entire world into east and west", answer:"Greenwich, London", blurb:"The Prime Meridian at the Royal Observatory Greenwich was established in 1884 at an international conference. A laser now projects the line into the sky at night, visible from miles away.", lat:51.4769, lng:-0.0005 },
  { id:62, type:"set", emoji:"🌍", clue:"The deepest lake in the world, containing roughly 20% of Earth's unfrozen surface fresh water, sits in the southern part of a vast Asian country's largest region", answer:"Lake Baikal, Siberia", blurb:"Lake Baikal is 1,642 meters deep and holds more fresh water than all of North America's Great Lakes combined. It is home to the nerpa, the world's only exclusively freshwater seal species.", lat:53.5587, lng:108.1650 },
  { id:63, type:"set", emoji:"🌍", clue:"This city is the only metropolis in the world that sits on two continents, with a famous strait running through its middle separating Europe from Asia", answer:"Istanbul, Turkey", blurb:"Istanbul's Bosphorus Strait divides the European and Asian sides of the city. The two halves are connected by three suspension bridges and an undersea rail tunnel completed in 2013.", lat:41.0082, lng:28.9784 },
  { id:64, type:"set", emoji:"🌍", clue:"This tiny European republic is the only country in the world completely surrounded by a single other nation, and claims to be the world's oldest surviving constitutional republic", answer:"San Marino", blurb:"San Marino sits entirely within Italian territory on Mount Titano and was founded in 301 AD according to tradition. With around 34,000 citizens, it has its own parliament, army, and Olympic committee.", lat:43.9424, lng:12.4578 },
  { id:65, type:"set", emoji:"🌍", clue:"The Amazon River discharges more fresh water into the ocean than the next seven largest rivers combined, pouring into the Atlantic near the equator off this country's coast", answer:"Pará, Brazil", blurb:"The Amazon's mouth near Marajó Island creates a freshwater zone extending 200 kilometers into the Atlantic. Portuguese navigators called it the River Sea because they couldn't see the far bank.", lat:-0.4653, lng:-49.9797 },
  { id:66, type:"set", emoji:"🌍", clue:"More countries share a border with this Central African nation than with any other country on Earth — nine neighbors in total", answer:"Democratic Republic of Congo", blurb:"The DRC borders Angola, Republic of Congo, Central African Republic, South Sudan, Uganda, Rwanda, Burundi, Tanzania, and Zambia. Its river basin is the second largest tropical rainforest on Earth.", lat:-4.0383, lng:21.7587 },
  { id:67, type:"set", emoji:"🌍", clue:"This remote South Atlantic island is considered the most isolated inhabited place on Earth, reachable only by a six-day boat journey from the nearest major port", answer:"Tristan da Cunha", blurb:"Tristan da Cunha has around 250 permanent residents with only eight family surnames. The island has no airstrip. When its volcano erupted in 1961, all residents were evacuated to England and later returned.", lat:-37.1052, lng:-12.2777 },
  { id:68, type:"set", emoji:"🌍", clue:"The only sea in the world with no coastline — entirely surrounded by ocean currents rather than land — sits in the middle of the North Atlantic", answer:"Sargasso Sea", blurb:"The Sargasso Sea is bounded by four ocean currents forming the North Atlantic Gyre. Named for its floating Sargassum seaweed, it is the spawning ground of both European and American eels.", lat:30.0000, lng:-60.0000 },
  { id:69, type:"set", emoji:"🌍", clue:"This landlocked African country's name adorns a massive lake that was once the sixth largest in the world but has shrunk by 90% due to climate change and irrigation diversion", answer:"Chad", blurb:"Lake Chad once covered 25,000 square kilometers and supported 30 million people across four countries. By 2020 it had shrunk to around 1,500 square kilometers, one of the world's most dramatic ecological collapses.", lat:15.4542, lng:18.7322 },
  { id:70, type:"set", emoji:"🌍", clue:"The world's longest mountain range runs nearly the entire length of this South American continent's western edge, averaging over 4,000 meters in elevation", answer:"Andes Mountains, South America", blurb:"The Andes stretch 7,000 kilometers from Venezuela to Tierra del Fuego, running through seven countries. They are also the world's highest mountain range outside of Asia.", lat:-13.5320, lng:-71.9675 },
];

// ── Daily Question Selection ───────────────────────────────────────────────────
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getDailyQuestions() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // Seeded shuffle
  const shuffled = [...ALL_QUESTIONS];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pick balanced set: 2 filmed, 2 set, 1 actor
  const filmed = shuffled.filter(q => q.type === "filmed");
  const set    = shuffled.filter(q => q.type === "set" || q.type === undefined);
  const actor  = shuffled.filter(q => q.type === "actor");
  return [filmed[0], set[0], actor[0], filmed[1], set[1]];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const KM_TO_MI = 0.621371;
function formatDist(km, unit) {
  return unit === "mi" ? `${Math.round(km * KM_TO_MI).toLocaleString()} mi` : `${Math.round(km).toLocaleString()} km`;
}
function loadUnit() { try { return localStorage.getItem("popgeo_unit") || "mi"; } catch { return "mi"; } }
function saveUnit(u) { try { localStorage.setItem("popgeo_unit", u); } catch {} }

function calcScore(d) {
  if (d < 50) return 1000;
  return Math.max(0, Math.round(1000 * Math.exp(-d / 2000)));
}

const FEEDBACK_TIERS = [
  { max: 50,       color: "#22c55e", labels: ["Perfect! 🎯", "Bullseye! 🎯", "Nailed it! 🎯", "Right on the money! 💰"] },
  { max: 200,      color: "#22c55e", labels: ["Outstanding! 🔥", "Excellent! 🔥", "So close! 🔥", "Almost exact! 💪"] },
  { max: 500,      color: "#84cc16", labels: ["Great! 👏", "Nice one! 👏", "Solid guess! 👌", "Pretty close! 👌"] },
  { max: 1000,     color: "#f59e0b", labels: ["Not bad!", "Could be worse!", "Room to improve 🤔", "Getting warmer 🌡️"] },
  { max: 2500,     color: "#f97316", labels: ["Way off 😬", "Oof, not close 😬", "That's a stretch 😅", "Yikes 😬", "Swing and a miss 😅"] },
  { max: Infinity, color: "#ef4444", labels: ["Ouch! 🌍", "Wrong side of the planet 🌍", "Did you guess blindfolded? 😂", "Ambitious guess 💀", "That's rough buddy 😬"] },
];
function getFeedback(km) {
  const mi = km * KM_TO_MI;
  const tier = FEEDBACK_TIERS.find(t => mi < t.max);
  return { label: tier.labels[Math.floor(Math.random() * tier.labels.length)], color: tier.color };
}
function scoreColor(s) {
  if (s >= 800) return "#22c55e"; if (s >= 500) return "#84cc16";
  if (s >= 200) return "#f59e0b"; return "#ef4444";
}
function scoreEmoji(s) {
  if (s >= 900) return "🟢"; if (s >= 600) return "🟡";
  if (s >= 200) return "🟠"; return "🔴";
}

const TYPE_META = {
  filmed: { label: "Where was it filmed?", color: "#93c5fd", bg: "rgba(29,78,216,0.25)", border: "rgba(59,130,246,0.5)" },
  set:    { label: "Where is it set?",     color: "#d8b4fe", bg: "rgba(124,58,237,0.25)", border: "rgba(167,139,250,0.5)" },
  actor:  { label: "Where are they from?", color: "#fcd34d", bg: "rgba(217,119,6,0.25)",  border: "rgba(251,191,36,0.5)" },
};

function buildShareText(questions, scores) {
  const d = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const total = scores.reduce((a, b) => a + b, 0);
  return `🎬 PopGeo — ${d}\n${scores.map(scoreEmoji).join("  ")}\n${total.toLocaleString()} / 5,000\npopgeo.app`;
}

async function shareResult(text, setShareText, setCopied) {
  if (navigator.share) {
    try { await navigator.share({ text }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2200); return; }
    catch (e) {}
  }
  setShareText(text);
}

function loadStreak() {
  try { return JSON.parse(localStorage.getItem("popgeo_streak") || "{}") || { count: 0, last: "" }; }
  catch { return { count: 0, last: "" }; }
}
function updateStreak() {
  const today = getTodayKey(), streak = loadStreak();
  if (streak.last === today) return streak.count;
  const d = new Date(); d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const count = streak.last === yesterday ? streak.count + 1 : 1;
  try { localStorage.setItem("popgeo_streak", JSON.stringify({ count, last: today })); } catch {}
  return count;
}

// ── Share Modal ────────────────────────────────────────────────────────────────
function ShareModal({ text, onClose }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    } else {
      const el = document.getElementById("share-ta");
      if (el) { el.select(); document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    }
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }} onClick={onClose}>
      <div style={{ background:"#060f20", border:"1px solid #0f2540", borderRadius:16, padding:24, width:"100%", maxWidth:340 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0" }}>Share your result</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#475569", fontSize:20, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ background:"#0a1525", borderRadius:10, padding:14, marginBottom:14, fontFamily:"monospace", fontSize:14, lineHeight:2, color:"#cbd5e1", whiteSpace:"pre" }}>{text}</div>
        <textarea id="share-ta" readOnly value={text} style={{ position:"absolute", opacity:0, pointerEvents:"none", width:1, height:1 }}/>
        <button onClick={handleCopy} style={{ width:"100%", padding:12, borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer", background:copied?"#166534":"#1d4ed8", color:"#fff", border:"none" }}>
          {copied ? "✓ Copied!" : "Copy to clipboard"}
        </button>
      </div>
    </div>
  );
}

// ── Settings Panel ─────────────────────────────────────────────────────────────
function SettingsPanel({ unit, onUnitChange, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }} onClick={onClose}>
      <div style={{ background:"#060f20", border:"1px solid #0f2540", borderRadius:16, padding:24, width:"100%", maxWidth:320 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:600, color:"#e2e8f0" }}>Settings</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#475569", fontSize:20, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ color:"#64748b", fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Distance Unit</div>
        <div style={{ display:"flex", gap:8, marginBottom:6 }}>
          {["mi","km"].map(u => (
            <button key={u} onClick={() => onUnitChange(u)} style={{ flex:1, padding:10, borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", background:unit===u?"#1d4ed8":"#0a1525", color:unit===u?"#fff":"#475569", border:unit===u?"1px solid #3b82f6":"1px solid #0f2540" }}>
              {u==="mi"?"Miles":"Kilometers"}
            </button>
          ))}
        </div>
        <div style={{ color:"#1e3a5f", fontSize:11, marginBottom:20 }}>Default: Miles · Saved automatically</div>
        <div style={{ borderTop:"1px solid #0f2540", paddingTop:16, color:"#334155", fontSize:12, lineHeight:1.6 }}>
          PopGeo · Daily pop culture geography · 5 questions · Distance scoring
        </div>
      </div>
    </div>
  );
}

// ── Mapbox Globe ───────────────────────────────────────────────────────────────
function Globe({ onPick, disabled, guess, answer, showAnswer, onMapReady }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef({ guess: null, answer: null });

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      projection: "globe",
      center: [-98, 38],
      zoom: 2.8,
      minZoom: 1.5,
      maxZoom: 12,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      if (onMapReady) onMapReady(map);
      const textLayers = ["country-label","state-label","settlement-label","settlement-subdivision-label","airport-label","poi-label","water-point-label","water-line-label","natural-point-label","natural-line-label","waterway-label","road-label-simple","transit-label","road-number-shield"];
      textLayers.forEach(id => { try { map.setLayoutProperty(id, "visibility", "none"); } catch(e) {} });
      map.setFog({ color:"rgb(10,20,40)", "high-color":"rgb(20,50,100)", "horizon-blend":0.06, "space-color":"rgb(4,11,24)", "star-intensity":0.6 });
      map.getStyle().layers.forEach(layer => {
        if (layer.type === "raster") {
          map.setPaintProperty(layer.id, "raster-brightness-min", 0.15);
          map.setPaintProperty(layer.id, "raster-brightness-max", 1.0);
          map.setPaintProperty(layer.id, "raster-saturation", 0.2);
        }
      });
      map.addSource("line-src", { type:"geojson", data:{ type:"Feature", geometry:{ type:"LineString", coordinates:[] } } });
      map.addLayer({ id:"guess-line", type:"line", source:"line-src", layout:{"line-join":"round","line-cap":"round"}, paint:{"line-color":"#fde047","line-width":2.5,"line-dasharray":[2,2],"line-opacity":0.9} });
    });

    map.on("click", e => { if (disabled) return; onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng }); });
    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    map.getCanvas().style.cursor = disabled ? "default" : "crosshair";
  }, [disabled]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (markersRef.current.guess) { markersRef.current.guess.remove(); markersRef.current.guess = null; }
    if (!guess) return;
    const el = document.createElement("div");
    el.style.cssText = "width:22px;height:22px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.6);";
    markersRef.current.guess = new mapboxgl.Marker({ element:el, anchor:"center" }).setLngLat([guess.lng, guess.lat]).addTo(map);
  }, [guess]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (markersRef.current.answer) { markersRef.current.answer.remove(); markersRef.current.answer = null; }
    if (!showAnswer || !answer) {
      if (map.getSource("line-src")) map.getSource("line-src").setData({ type:"Feature", geometry:{ type:"LineString", coordinates:[] } });
      return;
    }
    const el = document.createElement("div");
    el.style.cssText = "width:22px;height:22px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.6);";
    markersRef.current.answer = new mapboxgl.Marker({ element:el, anchor:"center" }).setLngLat([answer.lng, answer.lat]).addTo(map);
    if (map.getSource("line-src") && guess) {
      map.getSource("line-src").setData({ type:"Feature", geometry:{ type:"LineString", coordinates:[[guess.lng,guess.lat],[answer.lng,answer.lat]] } });
    }
    if (guess) {
      const bounds = new mapboxgl.LngLatBounds().extend([guess.lng,guess.lat]).extend([answer.lng,answer.lat]);
      map.fitBounds(bounds, { padding:100, maxZoom:6, duration:1200 });
    }
  }, [showAnswer, answer, guess]);

  return <div ref={containerRef} style={{ position:"absolute", inset:0 }}/>;
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function PopGeo() {
  const questions = getDailyQuestions();
  const [qIdx, setQIdx]       = useState(0);
  const [guess, setGuess]     = useState(null);
  const [confirmed, setConf]  = useState(false);
  const [scores, setScores]   = useState([]);
  const [dists, setDists]     = useState([]);
  const [phase, setPhase]     = useState("landing");
  const [streak, setStreak]   = useState(() => loadStreak().count);
  const [copied, setCopied]   = useState(false);
  const [unit, setUnit]       = useState(() => loadUnit());
  const [showSettings, setShowSettings] = useState(false);
  const [shareText, setShareText]       = useState(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    document.body.style.cssText = "margin:0;padding:0;background:#040b18;overflow:hidden;";
    document.documentElement.style.cssText = "margin:0;padding:0;background:#040b18;height:100%;";
  }, []);

  const q    = questions[qIdx];
  const meta = TYPE_META[q?.type] || TYPE_META.filmed;
  const total = scores.reduce((a,b)=>a+b,0);

  const handleUnitChange = u => { setUnit(u); saveUnit(u); };
  const handlePick = useCallback((coord) => { if (confirmed) return; setGuess(coord); }, [confirmed]);

  const handleConfirm = useCallback(() => {
    if (!guess || confirmed || !q) return;
    const dist  = haversine(guess.lat, guess.lng, q.lat, q.lng);
    const score = calcScore(dist);
    setDists(d => [...d, dist]);
    setScores(s => [...s, score]);
    setConf(true);
  }, [guess, confirmed, q]);

  const handleNext = () => {
    if (qIdx < questions.length - 1) {
      setQIdx(i => i + 1); setGuess(null); setConf(false);
    } else {
      const s = updateStreak(); setStreak(s); setPhase("done");
    }
  };

  const handleShare = () => { const text = buildShareText(questions, scores); shareResult(text, setShareText, setCopied); };

  const feedback  = confirmed ? getFeedback(dists[dists.length-1]) : null;
  const lastScore = scores[scores.length-1];
  const lastDist  = dists[dists.length-1];
  const todayLabel = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  // ── Landing ──
  if (phase === "landing") return (
    <div style={{ position:"fixed", inset:0, background:"#040b18", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif", padding:24 }}>
      {showSettings && <SettingsPanel unit={unit} onUnitChange={handleUnitChange} onClose={()=>setShowSettings(false)}/>}
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:120, height:120, borderRadius:"50%", background:"radial-gradient(ellipse at 35% 30%,#1e6fa8 0%,#0d4a70 40%,#041822 100%)", boxShadow:"0 0 0 1px rgba(100,180,255,0.15),0 0 60px rgba(30,100,220,0.3)", fontSize:60, marginBottom:4 }}>🌍</div>
          <div style={{ fontSize:36, fontWeight:800, background:"linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.03em", marginBottom:6 }}>PopGeo</div>
          <div style={{ color:"#94a3b8", fontSize:15 }}>Daily pop culture geography</div>
          <div style={{ color:"#64748b", fontSize:13, marginTop:4 }}>{todayLabel}</div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid #0a1a2e", borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
          {[{icon:"🌍",text:"Spin the globe to your answer"},{icon:"📍",text:"Tap once to lock in your guess"},{icon:"🎯",text:"Score up to 1,000 pts per question"}].map((item,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:i<2?10:0 }}>
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={{ color:"#94a3b8", fontSize:13 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {streak > 0 && (
          <div style={{ textAlign:"center", marginBottom:16, color:"#64748b", fontSize:13 }}>
            🔥 <span style={{ color:"#fbbf24", fontWeight:700 }}>{streak} day</span> streak — keep it going!
          </div>
        )}

        <button onClick={()=>setPhase("playing")} style={{ width:"100%", padding:18, borderRadius:14, fontSize:18, fontWeight:700, background:"linear-gradient(135deg,#1d4ed8,#2563eb)", color:"#fff", border:"1px solid #3b82f6", cursor:"pointer", boxShadow:"0 4px 24px rgba(29,78,216,0.4)", letterSpacing:"0.01em" }}>
          Play Today's Round →
        </button>
        <div style={{ textAlign:"center", marginTop:16 }}>
          <button onClick={()=>setShowSettings(true)} style={{ background:"none", border:"none", color:"#475569", fontSize:13, cursor:"pointer" }}>⚙ Settings</button>
        </div>
      </div>
    </div>
  );

  // ── Done ──
  if (phase === "done") return (
    <div style={{ position:"fixed", inset:0, background:"#040b18", overflowY:"auto", fontFamily:"system-ui,sans-serif" }}>
      {showSettings && <SettingsPanel unit={unit} onUnitChange={handleUnitChange} onClose={()=>setShowSettings(false)}/>}
      {shareText && <ShareModal text={shareText} onClose={()=>setShareText(null)}/>}
      <div style={{ maxWidth:480, margin:"0 auto", padding:"24px 16px 40px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:22, fontWeight:800, background:"linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>PopGeo</div>
          <button onClick={()=>setShowSettings(true)} style={{ background:"none", border:"none", color:"#334155", fontSize:18, cursor:"pointer" }}>⚙</button>
        </div>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:44 }}>🎬</div>
          <div style={{ fontSize:24, color:"#e2e8f0", fontWeight:600, marginBottom:2 }}>Round Complete</div>
          <div style={{ color:"#475569", fontSize:13 }}>{todayLabel}</div>
          <div style={{ fontSize:48, fontWeight:800, color:"#f1f5f9", margin:"16px 0 2px" }}>{total.toLocaleString()}</div>
          <div style={{ color:"#475569", fontSize:13, marginBottom:8 }}>out of 5,000 points</div>
          {streak > 0 && <div style={{ color:"#64748b", fontSize:13 }}>🔥 <span style={{ color:"#fbbf24", fontWeight:700 }}>{streak} day</span> streak</div>}
        </div>

        <div style={{ background:"#070e1a", borderRadius:8, height:6, marginBottom:20, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.round((total/5000)*100)}%`, background:"linear-gradient(90deg,#3b82f6,#22c55e)", borderRadius:8 }}/>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {questions.map((qu,i) => {
            const m = TYPE_META[qu.type] || TYPE_META.filmed;
            return <div key={qu.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#070e1a", borderRadius:8, padding:"10px 14px", borderLeft:`3px solid ${m.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
                <span style={{ fontSize:16 }}>{scoreEmoji(scores[i])}</span>
                <span style={{ color:"#94a3b8", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{qu.answer}</span>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
                <span style={{ color:"#475569", fontSize:11 }}>{formatDist(dists[i],unit)}</span>
                <span style={{ color:scoreColor(scores[i]), fontWeight:700, fontSize:15, minWidth:40, textAlign:"right" }}>{scores[i].toLocaleString()}</span>
              </div>
            </div>;
          })}
        </div>

        <div style={{ fontSize:24, letterSpacing:8, textAlign:"center", marginBottom:20 }}>{scores.map(scoreEmoji).join("")}</div>
        <button onClick={handleShare} style={{ width:"100%", padding:14, borderRadius:10, fontSize:15, fontWeight:600, cursor:"pointer", background:copied?"#166534":"#1d4ed8", color:"#fff", border:"none", marginBottom:8 }}>
          {copied ? "✓ Copied!" : "📲 Share Result"}
        </button>
        <div style={{ textAlign:"center", color:"#475569", fontSize:12, marginTop:8 }}>Come back tomorrow for a new round</div>
      </div>
    </div>
  );

  // ── Playing ──
  return (
    <div style={{ position:"fixed", inset:0, background:"#040b18", fontFamily:"system-ui,sans-serif", overflow:"hidden" }}>
      {showSettings && <SettingsPanel unit={unit} onUnitChange={handleUnitChange} onClose={()=>setShowSettings(false)}/>}
      {shareText && <ShareModal text={shareText} onClose={()=>setShareText(null)}/>}

      <Globe onPick={handlePick} disabled={confirmed} guess={guess}
        answer={confirmed?{lat:q.lat,lng:q.lng}:null} showAnswer={confirmed}
        onMapReady={map=>{mapInstanceRef.current=map;}}/>

      {/* Top bar pre-guess */}
      <div style={{ position:"absolute", top:0, left:0, right:0, padding:"50px 16px 12px", background:"linear-gradient(to bottom,rgba(4,11,24,0.92) 0%,rgba(4,11,24,0) 100%)", transition:"opacity 0.4s ease, transform 0.4s ease", opacity:confirmed?0:1, transform:confirmed?"translateY(-20px)":"translateY(0)", pointerEvents:confirmed?"none":"all" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:20, fontWeight:800, background:"linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>PopGeo</div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", gap:5 }}>
              {questions.map((_,i) => <div key={i} style={{ width:22, height:3, borderRadius:2, background:i<qIdx?"#22c55e":i===qIdx?"#3b82f6":"rgba(255,255,255,0.1)" }}/>)}
            </div>
            <span style={{ color:"#334155", fontSize:11 }}>{qIdx+1}/5</span>
            <button onClick={()=>setShowSettings(true)} style={{ background:"none", border:"none", color:"#334155", fontSize:16, cursor:"pointer" }}>⚙</button>
          </div>
        </div>
        <div style={{ display:"inline-block", background:"rgba(4,11,24,0.75)", border:`1px solid ${meta.border}`, borderRadius:20, padding:"3px 12px", fontSize:11, color:meta.color, fontFamily:"monospace", letterSpacing:"0.04em", marginBottom:6, backdropFilter:"blur(8px)" }}>
          {q.emoji} {meta.label}
        </div>
        <div style={{ background:"rgba(4,11,24,0.82)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"10px 14px", marginTop:4 }}>
          <div style={{ fontSize:14, lineHeight:1.55, color:"#e2e8f0", fontStyle:"italic" }}>"{q.clue}"</div>
        </div>
      </div>

      {/* Top bar post-guess */}
      {confirmed && (
        <div style={{ position:"absolute", top:0, left:0, right:0, padding:"50px 16px 10px", background:"linear-gradient(to bottom,rgba(4,11,24,0.85) 0%,rgba(4,11,24,0) 100%)", pointerEvents:"none" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, background:"linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>PopGeo</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ display:"flex", gap:4 }}>
                {questions.map((_,i) => <div key={i} style={{ width:20, height:3, borderRadius:2, background:i<qIdx?"#22c55e":i===qIdx?"#3b82f6":"rgba(255,255,255,0.1)" }}/>)}
              </div>
              <span style={{ color:"#334155", fontSize:11 }}>{qIdx+1}/5</span>
              <button onClick={()=>setShowSettings(true)} style={{ background:"none", border:"none", color:"#334155", fontSize:15, cursor:"pointer", pointerEvents:"all" }}>⚙</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom panel */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(to top,rgba(4,11,24,0.97) 60%,rgba(4,11,24,0) 100%)", padding:"60px 16px 40px" }}>
        {!confirmed ? (
          <div style={{ maxWidth:480, margin:"0 auto" }}>
            <div style={{ textAlign:"center", color:"#64748b", fontSize:12, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:10 }}>
              {guess ? "Pin placed — confirm when ready" : "Drag globe · Tap to place pin"}
            </div>
            <button onClick={handleConfirm} disabled={!guess} style={{ width:"100%", padding:14, borderRadius:10, fontSize:15, fontWeight:700, cursor:guess?"pointer":"not-allowed", background:guess?"linear-gradient(135deg,#1d4ed8,#2563eb)":"rgba(255,255,255,0.04)", color:guess?"#fff":"#475569", border:guess?"1px solid #3b82f6":"1px solid rgba(255,255,255,0.08)", transition:"all 0.2s", boxShadow:guess?"0 4px 20px rgba(29,78,216,0.4)":"none" }}>
              {guess ? "Confirm Guess ✓" : "Tap the globe to guess"}
            </button>
          </div>
        ) : (
          <div style={{ maxWidth:480, margin:"0 auto" }}>
            {/* Feedback + score — frosted card */}
            <div style={{ background:"rgba(4,11,24,0.82)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:12, padding:"12px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:17, fontWeight:700, color:feedback.color }}>{feedback.label}</div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontSize:28, fontWeight:800, color:scoreColor(lastScore) }}>{lastScore.toLocaleString()}</span>
                  <span style={{ color:"#64748b", fontSize:13 }}> / 1,000</span>
                </div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:4, height:4, marginBottom:10, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.round((lastScore/1000)*100)}%`, background:scoreColor(lastScore), borderRadius:4 }}/>
              </div>
              <div style={{ color:"#94a3b8", fontSize:12 }}>{formatDist(lastDist,unit)} from the answer</div>
            </div>

            {/* Answer blurb */}
            <div style={{ background:"rgba(4,11,24,0.85)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 16px", marginBottom:14 }}>
              <div style={{ color:"#475569", fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Answer</div>
              <div style={{ color:"#f1f5f9", fontSize:17, fontWeight:700, marginBottom:6, letterSpacing:"-0.01em" }}>{q.answer}</div>
              <div style={{ width:32, height:2, background:"linear-gradient(90deg,#3b82f6,#22c55e)", borderRadius:2, marginBottom:8 }}/>
              <div style={{ color:"#94a3b8", fontSize:13, lineHeight:1.65, fontWeight:400 }}>{q.blurb}</div>
            </div>

            <button onClick={handleNext} style={{ width:"100%", padding:14, borderRadius:10, fontSize:15, fontWeight:700, background:"#166534", color:"#fff", border:"1px solid #22c55e", cursor:"pointer" }}>
              {qIdx<questions.length-1?"Next Question →":"See Results →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
