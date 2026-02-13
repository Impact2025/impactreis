/**
 * Tony Robbins Unleashed - Complete Course Content
 * Run this to seed the database with the full course
 */

export const UNLEASHED_COURSE = {
  slug: 'unleash-your-power',
  title: 'Unleash Your Power',
  subtitle: 'De Complete Transformatiereis',
  description: 'Een 12-weken transformatieprogramma gebaseerd op de bewezen methodes van Tony Robbins. Leer je staat te managen, beperkende overtuigingen te doorbreken, en je ware potentieel te ontgrendelen.',
  image_url: null,
  estimated_weeks: 12,
  difficulty: 'intermediate',
  modules: [
    // MODULE 1: AWAKENING
    {
      slug: 'awakening',
      title: 'Awakening',
      subtitle: 'De Staat van Meesterschap',
      description: 'Leer de fundamenten van state management en ontdek hoe je fysiologie, focus en taal je emoties bepalen.',
      week_start: 1,
      week_end: 2,
      icon: 'zap',
      color: 'blue',
      lessons: [
        {
          slug: 'de-triad',
          title: 'De Triad',
          subtitle: 'Fysiologie, Focus & Taal',
          lesson_type: 'theory',
          estimated_minutes: 15,
          content: {
            intro: {
              quote: 'De kwaliteit van je leven is de kwaliteit van je emoties.',
              quote_author: 'Tony Robbins',
              text: 'Alles wat je ervaart in het leven - vreugde, verdriet, woede, passie - wordt bepaald door je emotionele staat. En het goede nieuws? Je hebt volledige controle over die staat.'
            },
            sections: [
              {
                title: 'Wat is de Triad?',
                type: 'text',
                content: 'De Triad is Tony Robbins\' model dat verklaart hoe onze emotionele staat wordt gecreëerd. Het bestaat uit drie onderling verbonden elementen die samen bepalen hoe je je voelt op elk moment.'
              },
              {
                title: 'De Drie Elementen',
                type: 'list',
                content: '',
                items: [
                  'FYSIOLOGIE - Hoe je je lichaam gebruikt: je houding, ademhaling, beweging en gezichtsuitdrukking',
                  'FOCUS - Waar je je aandacht op richt: wat je ziet, hoort en tegen jezelf zegt',
                  'TAAL/BETEKENIS - De woorden die je gebruikt en de betekenis die je aan gebeurtenissen geeft'
                ]
              },
              {
                type: 'callout',
                style: 'tip',
                title: 'Het Geheim',
                content: 'Je kunt je emotionele staat in seconden veranderen door één van deze drie elementen bewust aan te passen. Verander je houding, verander je focus, of verander de betekenis - en je emotie verandert onmiddellijk mee.'
              },
              {
                title: 'Fysiologie: Je Lichaam als Instrument',
                type: 'text',
                content: 'Je lichaam en geest zijn onlosmakelijk verbonden. Probeer dit: laat je schouders hangen, kijk naar de grond, en adem oppervlakkig. Merk je hoe je je direct minder energiek voelt? Doe nu het tegenovergestelde: sta rechtop, kijk omhoog, glimlach breed, en adem diep. Voel je het verschil?\n\nJe fysiologie stuurt directe signalen naar je brein over hoe je je zou moeten voelen. Door je lichaamshouding bewust aan te passen, kun je je emotionele staat transformeren.'
              },
              {
                title: 'Focus: Waar Aandacht Gaat, Vloeit Energie',
                type: 'text',
                content: 'Op elk moment in je leven zijn er dingen die goed gaan én dingen die beter kunnen. Waar je voor kiest om je op te focussen, bepaalt je ervaring van de realiteit.\n\nAls je je focust op wat er mis is, wat je mist, of wat er fout kan gaan, creëer je angst, frustratie of verdriet. Maar als je je focust op wat je hebt, wat mogelijk is, en waar je dankbaar voor bent, creëer je positieve emoties.'
              },
              {
                title: 'Taal: De Architect van Betekenis',
                type: 'text',
                content: 'De woorden die je gebruikt - zowel hardop als in je hoofd - vormen je realiteit. Er is een groot verschil tussen "Ik ben woedend" en "Ik voel me een beetje geïrriteerd". De eerste versterkt de emotie, de tweede minimaliseert deze.\n\nDaarnaast bepaalt de betekenis die je aan gebeurtenissen geeft hoe je erop reageert. Verlies van een baan kan "het einde van de wereld" zijn, of "een kans voor iets beters". Dezelfde gebeurtenis, compleet andere ervaring.'
              }
            ],
            reflection_questions: [
              {
                key: 'current_state',
                question: 'Hoe zou je je huidige emotionele "thuisbasis" omschrijven?',
                description: 'Denk aan de emotie waar je het vaakst in verkeert.',
                type: 'textarea',
                placeholder: 'Beschrijf je meest voorkomende emotionele staat...'
              },
              {
                key: 'physiology_pattern',
                question: 'Welke fysiologische patronen merk je op als je je down voelt?',
                type: 'textarea',
                placeholder: 'Bijvoorbeeld: schouders hangen, oppervlakkige ademhaling...'
              },
              {
                key: 'focus_pattern',
                question: 'Waar focus je je meestal op: wat er mis is, of wat er goed gaat?',
                type: 'multiple_choice',
                options: [
                  { label: 'Vooral op problemen en uitdagingen', value: 'problems' },
                  { label: 'Mix van beide', value: 'mixed' },
                  { label: 'Vooral op kansen en mogelijkheden', value: 'opportunities' }
                ]
              }
            ],
            commitments: [
              'Ik observeer vandaag bewust mijn lichaamshouding 3x en pas deze aan',
              'Ik stel mezelf de vraag: "Waar focus ik me nu op?" minimaal 5x',
              'Ik vervang één negatief woord door een neutraler of positiever alternatief'
            ],
            closing: {
              quote: 'Als je je fysiologie verandert, verander je je biochemie, en verander je je leven.',
              quote_author: 'Tony Robbins'
            }
          }
        },
        {
          slug: 'state-management',
          title: 'State Management',
          subtitle: 'Meester van Je Emoties',
          lesson_type: 'theory',
          estimated_minutes: 12,
          content: {
            intro: {
              quote: 'Je kunt niet altijd controleren wat er gebeurt, maar je kunt altijd controleren hoe je reageert.',
              quote_author: 'Tony Robbins',
              text: 'State management is de vaardigheid om bewust je emotionele staat te kiezen en te veranderen, ongeacht de externe omstandigheden.'
            },
            sections: [
              {
                title: 'Waarom State Management?',
                type: 'text',
                content: 'Stel je voor dat je volledige controle hebt over hoe je je voelt. Geen slechte dagen meer die je overkomen - alleen bewuste keuzes over je emotionele staat. Dit is geen fantasie, dit is een leerbare vaardigheid.\n\nJe staat bepaalt je gedrag. Je gedrag bepaalt je resultaten. Dus door je staat te managen, bepaal je uiteindelijk je resultaten in het leven.'
              },
              {
                type: 'callout',
                style: 'info',
                title: 'De State-Behavior-Results Keten',
                content: 'Staat → Gedrag → Resultaten. Als je je gestrest voelt, neem je andere beslissingen dan wanneer je je zelfverzekerd voelt. Die beslissingen leiden tot verschillende acties, en die acties tot verschillende resultaten.'
              },
              {
                title: 'Instant State Change Technieken',
                type: 'list',
                content: 'Hier zijn krachtige manieren om je staat in seconden te veranderen:',
                items: [
                  'Power Pose - Neem 2 minuten een krachtige houding aan (armen wijd, borst vooruit)',
                  'Beweging - Spring, dans, doe jumping jacks - beweging verandert emotie',
                  'Ademhaling - Neem 10 diepe, krachtige ademhalingen',
                  'Gezichtsuitdrukking - Forceer een brede glimlach voor 60 seconden',
                  'Incantations - Spreek krachtige affirmaties uit met volle emotie en beweging',
                  'Music - Zet een nummer op dat je instant energie geeft',
                  'Herinnering - Ga terug naar een moment van totale kracht en herbeleef het'
                ]
              },
              {
                title: 'De Peak State',
                type: 'text',
                content: 'Een peak state is een moment van optimale prestatie - je voelt je onverslaanbaar, gefocust, en vol energie. Topsporters, ondernemers en artiesten leren bewust deze staat op te roepen voor hun belangrijkste momenten.\n\nJij kunt dit ook leren. Het begint met het identificeren van je eigen peak state: Hoe voelt het? Hoe staat je lichaam? Waar focus je je op? Welke woorden gebruik je?'
              }
            ],
            reflection_questions: [
              {
                key: 'peak_state_memory',
                question: 'Beschrijf een moment waarop je je absoluut onverslaanbaar voelde.',
                description: 'Wat gebeurde er? Hoe stond je? Wat dacht je?',
                type: 'textarea'
              },
              {
                key: 'state_change_technique',
                question: 'Welke state change techniek spreekt je het meest aan om te proberen?',
                type: 'multiple_choice',
                options: [
                  { label: 'Beweging en fysieke activiteit', value: 'movement' },
                  { label: 'Ademhaling', value: 'breathing' },
                  { label: 'Muziek', value: 'music' },
                  { label: 'Incantations/Affirmaties', value: 'incantations' }
                ]
              }
            ],
            commitments: [
              'Ik oefen vandaag minimaal één state change techniek wanneer ik merk dat mijn energie daalt',
              'Ik identificeer mijn persoonlijke "power song" die me instant energie geeft'
            ]
          }
        },
        {
          slug: 'priming-ritual',
          title: 'Het Priming Ritual',
          subtitle: 'De Ultieme Ochtendroutine',
          lesson_type: 'exercise',
          estimated_minutes: 20,
          content: {
            intro: {
              quote: 'Als je niet je eigen dag plant, staat iemand anders klaar om dat voor je te doen.',
              quote_author: 'Tony Robbins',
              text: 'Priming is Tony Robbins\' dagelijkse routine om zijn geest en lichaam te "programmeren" voor succes. In 10-30 minuten per ochtend zet je de toon voor je hele dag.'
            },
            sections: [
              {
                title: 'Wat is Priming?',
                type: 'text',
                content: 'Priming is een combinatie van ademhaling, beweging, dankbaarheid en visualisatie die je nervenstelsel activeert en je geest focust op wat belangrijk is. Het is geen meditatie - het is een actieve praktijk die je in een staat van kracht brengt.'
              },
              {
                title: 'De Drie Fasen van Priming',
                type: 'list',
                content: '',
                items: [
                  'ADEMHALING (3 min) - Krachtige, ritmische ademhaling om je fysiologie te activeren',
                  'DANKBAARHEID (3 min) - Drie momenten waar je intens dankbaar voor bent, volledig voelen',
                  'VISUALISATIE (3 min) - Je doelen zien als al bereikt, de emotie voelen van succes'
                ]
              },
              {
                type: 'callout',
                style: 'tip',
                title: 'Tony\'s Tip',
                content: 'Het gaat niet om de tijd, het gaat om de intensiteit. 10 minuten intense priming is krachtiger dan een uur oppervlakkige meditatie. Breng echte emotie in elke fase.'
              },
              {
                title: 'Bonus: De 4e Fase - Focus',
                type: 'text',
                content: 'Na de drie hoofdfasen, neem 1-2 minuten om je top 3 prioriteiten voor de dag te bepalen. Niet 10 dingen - 3 dingen. Wat zijn de taken die, als je ze voltooit, deze dag een succes maken?'
              }
            ],
            exercises: [
              {
                type: 'priming',
                title: '10-Minuten Priming Sessie',
                description: 'Volg de begeleide priming oefening om je dag krachtig te starten.',
                duration_minutes: 10
              }
            ],
            commitments: [
              'Ik doe morgenochtend direct na het opstaan mijn eerste priming sessie',
              'Ik zet een alarm 10 minuten eerder om tijd te maken voor priming'
            ],
            closing: {
              quote: 'Win de ochtend, win de dag.',
              quote_author: 'Tony Robbins'
            }
          }
        },
        {
          slug: 'incantations',
          title: 'Incantations',
          subtitle: 'Affirmaties met Kracht',
          lesson_type: 'exercise',
          estimated_minutes: 15,
          content: {
            intro: {
              quote: 'Affirmaties zonder emotie zijn leugens. Incantations zijn de waarheid die je belichaamt.',
              quote_author: 'Tony Robbins',
              text: 'Incantations zijn geen gewone affirmaties. Ze combineren woorden met beweging, ademhaling en intense emotie om nieuwe overtuigingen diep in je nervenstelsel te verankeren.'
            },
            sections: [
              {
                title: 'Het Verschil met Affirmaties',
                type: 'text',
                content: 'Klassieke affirmaties - "Ik ben succesvol, ik ben succesvol" - werken vaak niet omdat je ze zonder emotie of overtuiging uitspreekt. Je brein gelooft het simpelweg niet.\n\nIncantations zijn anders. Je spreekt ze uit met volle kracht, terwijl je beweegt, terwijl je ze VOELT in elke vezel van je lichaam. Dit maakt het verschil tussen hopen en WETEN.'
              },
              {
                title: 'Hoe Doe Je Een Incantation?',
                type: 'list',
                content: '',
                items: [
                  'Sta op en beweeg - loop, spring, maak krachtige gebaren',
                  'Spreek HARD en met overtuiging - fluisteren werkt niet',
                  'Gebruik de tegenwoordige tijd - "Ik BEN" niet "Ik zal zijn"',
                  'Voel de emotie - stel je voor dat het nu al waar is',
                  'Herhaal met toenemende intensiteit - laat het groeien'
                ]
              },
              {
                title: 'Krachtige Incantations',
                type: 'list',
                content: 'Hier zijn enkele voorbeelden die je kunt gebruiken of aanpassen:',
                items: [
                  '"Ik ben onverslaanbaar. Ik ben een krachtbron. Alles wat ik nodig heb zit in mij."',
                  '"Iedere dag, in elk opzicht, word ik sterker en sterker!"',
                  '"Ik ben de architect van mijn leven. Ik bouw het fundament en kies de inhoud."',
                  '"Succes is mijn geboorterecht. Ik claim het NU."',
                  '"Ik geef meer dan ik verwacht te ontvangen. Ik draag bij. Ik maak verschil."'
                ]
              },
              {
                type: 'callout',
                style: 'warning',
                title: 'Belangrijk',
                content: 'Dit voelt in het begin ongemakkelijk. Dat is normaal. Het ongemak is precies waar de groei zit. Push door het gevoel van "dit is raar" en je zult de kracht ervaren.'
              }
            ],
            reflection_questions: [
              {
                key: 'personal_incantation',
                question: 'Schrijf je eigen persoonlijke incantation die je gaat gebruiken.',
                description: 'Maak het specifiek, krachtig, en in de tegenwoordige tijd.',
                type: 'textarea',
                placeholder: 'Ik ben...'
              }
            ],
            commitments: [
              'Ik doe morgen mijn incantation minstens 3 minuten met volle intensiteit',
              'Ik doe mijn incantation op een plek waar ik me vrij voel om luid te spreken'
            ]
          }
        },
        {
          slug: 'peak-state-on-demand',
          title: 'Peak State On Demand',
          subtitle: 'Je Beste Staat Wanneer Je Wilt',
          lesson_type: 'reflection',
          estimated_minutes: 12,
          content: {
            intro: {
              quote: 'De vraag is niet of je bang bent. De vraag is: kun je actie ondernemen ondanks de angst?',
              quote_author: 'Tony Robbins',
              text: 'Na deze module kun je je peak state oproepen wanneer je het nodig hebt - voor een presentatie, een moeilijk gesprek, of gewoon om je dag te transformeren.'
            },
            sections: [
              {
                title: 'Je Peak State Ankerpunt Creëren',
                type: 'text',
                content: 'Een ankerpunt is een fysieke trigger die gekoppeld is aan een emotionele staat. Door consistent dezelfde beweging te maken wanneer je in een peak state bent, train je je brein om die staat te associëren met die beweging.\n\nKies een uniek gebaar - een vuist maken, twee vingers tegen je hart, een specifieke beweging - iets dat je niet per ongeluk doet.'
              },
              {
                title: 'Het Ankerpunt Installeren',
                type: 'list',
                content: 'Volg deze stappen om je ankerpunt te creëren:',
                items: [
                  'Ga terug naar een herinnering waar je je absoluut krachtig voelde',
                  'Herbeleef het moment volledig - zie wat je zag, hoor wat je hoorde, voel wat je voelde',
                  'Laat de emotie groeien en groeien',
                  'Op het HOOGTEPUNT van de emotie, maak je gekozen gebaar',
                  'Houd het gebaar 5-10 seconden vast terwijl je in die staat blijft',
                  'Herhaal dit proces 5-7 keer met verschillende krachtige herinneringen'
                ]
              },
              {
                type: 'callout',
                style: 'success',
                title: 'Het Resultaat',
                content: 'Na voldoende herhaling kun je je gebaar maken en direct de emotionele staat voelen die je eraan gekoppeld hebt. Dit is je "aan-knop" voor peak performance.'
              }
            ],
            reflection_questions: [
              {
                key: 'peak_moments',
                question: 'Noem 3 momenten in je leven waarop je je absoluut onverslaanbaar voelde.',
                type: 'textarea',
                placeholder: '1. ...\n2. ...\n3. ...'
              },
              {
                key: 'anchor_gesture',
                question: 'Welk gebaar kies je als je ankerpunt?',
                type: 'text',
                placeholder: 'Bijvoorbeeld: vuist tegen hart, twee vingers omhoog...'
              },
              {
                key: 'when_to_use',
                question: 'In welke situaties zou je je peak state het meest willen kunnen oproepen?',
                type: 'textarea'
              }
            ],
            commitments: [
              'Ik oefen deze week elke dag 5 minuten met het installeren van mijn ankerpunt',
              'Ik identificeer 5 krachtige herinneringen die ik kan gebruiken'
            ],
            closing: {
              quote: 'Het verschil tussen mensen die slagen en mensen die falen is vaak alleen hun staat op het moment van beslissing.',
              quote_author: 'Tony Robbins'
            }
          }
        }
      ]
    },
    // MODULE 2: BELIEFS
    {
      slug: 'beliefs',
      title: 'Beliefs',
      subtitle: 'De Architectuur van Overtuigingen',
      description: 'Ontdek hoe overtuigingen ontstaan, identificeer je beperkende beliefs, en leer ze te transformeren.',
      week_start: 3,
      week_end: 4,
      icon: 'shield',
      color: 'purple',
      lessons: [
        {
          slug: 'belief-systems',
          title: 'Belief Systems',
          subtitle: 'Hoe Overtuigingen Ontstaan',
          lesson_type: 'theory',
          estimated_minutes: 15,
          content: {
            intro: {
              quote: 'Het zijn niet de omstandigheden van je leven die je lot bepalen, maar je beslissingen over die omstandigheden.',
              quote_author: 'Tony Robbins',
              text: 'Een overtuiging is niets meer dan een gevoel van zekerheid over wat iets betekent. Begrijp hoe ze ontstaan, en je kunt ze veranderen.'
            },
            sections: [
              {
                title: 'Wat is een Overtuiging?',
                type: 'text',
                content: 'Stel je een overtuiging voor als een tafel. Het tafelblad is de overtuiging zelf - bijvoorbeeld "Ik ben niet goed genoeg". De poten van de tafel zijn de referenties - de ervaringen en "bewijzen" die de overtuiging ondersteunen.\n\nHoe meer poten (referenties), hoe stabieler de tafel (overtuiging). Een overtuiging met veel referenties voelt als absolute waarheid, ook al is het dat niet.'
              },
              {
                title: 'Drie Soorten Overtuigingen',
                type: 'list',
                content: '',
                items: [
                  'GLOBALE OVERTUIGINGEN - Algemene beliefs over het leven, mensen, de wereld ("Het leven is hard", "Mensen zijn niet te vertrouwen")',
                  'IDENTITEITSOVERTUIGINGEN - Beliefs over wie je bent ("Ik ben een verliezer", "Ik ben creatief")',
                  'REGELS - Beliefs over wat er moet gebeuren om je een bepaalde manier te voelen ("Ik kan pas gelukkig zijn als...")'
                ]
              },
              {
                type: 'callout',
                style: 'warning',
                title: 'Let Op',
                content: 'Beperkende overtuigingen voelen als feiten. "Ik kan niet..." voelt net zo waar als "de lucht is blauw". Maar een overtuiging is geen feit - het is een interpretatie die je kunt veranderen.'
              },
              {
                title: 'Hoe Overtuigingen Ontstaan',
                type: 'text',
                content: '1. ERVARING - Iets gebeurt (je faalt bij een test)\n2. INTERPRETATIE - Je geeft er betekenis aan ("Ik ben dom")\n3. REFERENTIE - Dit wordt een poot onder de overtuiging\n4. BEVESTIGING - Je zoekt (onbewust) naar meer bewijs\n5. ZEKERHEID - Na genoeg referenties voelt het als waarheid\n\nHet goede nieuws? Je kunt nieuwe referenties creëren en oude herinterpreteren.'
              }
            ],
            reflection_questions: [
              {
                key: 'identity_beliefs',
                question: 'Welke zinnen beginnen in je hoofd vaak met "Ik ben..."?',
                description: 'Zowel positief als negatief.',
                type: 'textarea'
              },
              {
                key: 'belief_origin',
                question: 'Kun je je herinneren waar één van je beperkende overtuigingen vandaan komt?',
                type: 'textarea'
              }
            ]
          }
        },
        {
          slug: 'limiting-beliefs-audit',
          title: 'Limiting Beliefs Audit',
          subtitle: 'Identificeer Je Blokkades',
          lesson_type: 'reflection',
          estimated_minutes: 20,
          content: {
            intro: {
              quote: 'Het enige dat je ervan weerhoudt te krijgen wat je wilt, is het verhaal dat je jezelf steeds weer vertelt.',
              quote_author: 'Tony Robbins'
            },
            sections: [
              {
                title: 'De Audit',
                type: 'text',
                content: 'In deze les ga je diep graven naar de overtuigingen die je mogelijk tegenhouden. Dit vereist eerlijkheid en moed - je gaat dingen onder ogen zien die je misschien liever vermijdt.'
              },
              {
                title: 'Gebieden om te Onderzoeken',
                type: 'list',
                content: 'Kijk naar je overtuigingen in elk van deze gebieden:',
                items: [
                  'GELD & SUCCES - "Geld is de wortel van alle kwaad", "Rijke mensen zijn oneerlijk"',
                  'RELATIES - "Alle goede mensen zijn al bezet", "Ik word altijd gekwetst"',
                  'GEZONDHEID - "In onze familie worden we allemaal dik", "Ik heb geen discipline"',
                  'CARRIÈRE - "Je moet hard werken om succesvol te zijn", "Ik ben te oud/jong"',
                  'ZELFBEELD - "Ik ben niet slim genoeg", "Ik verdien het niet"'
                ]
              }
            ],
            reflection_questions: [
              {
                key: 'limiting_belief_1',
                question: 'Wat is je meest beperkende overtuiging over GELD of SUCCES?',
                type: 'textarea',
                placeholder: 'Ik geloof dat...'
              },
              {
                key: 'limiting_belief_2',
                question: 'Wat is je meest beperkende overtuiging over RELATIES?',
                type: 'textarea'
              },
              {
                key: 'limiting_belief_3',
                question: 'Wat is je meest beperkende overtuiging over JEZELF?',
                type: 'textarea'
              },
              {
                key: 'biggest_limiter',
                question: 'Als je er één moest kiezen: welke overtuiging houdt je het meeste tegen?',
                type: 'textarea'
              },
              {
                key: 'cost_so_far',
                question: 'Wat heeft deze overtuiging je tot nu toe gekost in je leven?',
                type: 'textarea'
              }
            ]
          }
        },
        {
          slug: 'dickens-process',
          title: 'The Dickens Process',
          subtitle: 'Confronteer de Pijn van Niet Veranderen',
          lesson_type: 'exercise',
          estimated_minutes: 25,
          content: {
            intro: {
              quote: 'Verandering gebeurt wanneer de pijn van hetzelfde blijven groter wordt dan de pijn van veranderen.',
              quote_author: 'Tony Robbins',
              text: 'Het Dickens Process (geïnspireerd door "A Christmas Carol") is een van de krachtigste interventies om beperkende overtuigingen te doorbreken door de volledige consequenties ervan te voelen.'
            },
            sections: [
              {
                title: 'Hoe Het Werkt',
                type: 'text',
                content: 'In dit proces reis je mentaal naar de toekomst en ervaart je de VOLLEDIGE pijn van niet veranderen. Je voelt wat je overtuiging je gaat kosten - niet intellectueel, maar emotioneel.\n\nDit is confronterend. Het is bedoeld om confronterend te zijn. De pijn is de brandstof voor verandering.'
              },
              {
                type: 'callout',
                style: 'warning',
                title: 'Voorbereiding',
                content: 'Zorg dat je alleen bent en niet gestoord wordt. Dit is intense innerlijke arbeid. Het is normaal als er emoties loskomen - dat is precies de bedoeling.'
              },
              {
                title: 'De Stappen',
                type: 'list',
                content: '',
                items: [
                  'Kies de overtuiging die je wilt veranderen',
                  'Sluit je ogen en ga naar een moment 5 jaar in de toekomst',
                  'Leef volledig in die toekomst waar je deze overtuiging NIET hebt veranderd',
                  'Wat zie je? Wat heb je gemist? Wie heb je teleurgesteld?',
                  'Ga nu naar 10 jaar in de toekomst - nog steeds niet veranderd',
                  'Voel de spijt, het verlies, de pijn',
                  'Ga naar 20 jaar - je bent aan het einde van je leven',
                  'Wat is er nooit gebeurd omdat je niet veranderde?'
                ]
              }
            ],
            exercises: [
              {
                type: 'dickens',
                title: 'Dickens Process Oefening',
                description: 'Doorloop het volledige Dickens Process voor je meest beperkende overtuiging.',
                duration_minutes: 15
              }
            ],
            reflection_questions: [
              {
                key: 'dickens_experience',
                question: 'Beschrijf wat je zag en voelde tijdens het Dickens Process.',
                type: 'textarea'
              },
              {
                key: 'motivation_level',
                question: 'Hoe gemotiveerd ben je nu om deze overtuiging te veranderen? (1-10)',
                type: 'scale',
                min: 1,
                max: 10
              }
            ]
          }
        },
        {
          slug: 'belief-transformation',
          title: 'Belief Transformation',
          subtitle: 'Nieuwe Referenties Creëren',
          lesson_type: 'theory',
          estimated_minutes: 15,
          content: {
            intro: {
              quote: 'Een overtuiging is alleen een gedachte die je blijft denken.',
              quote_author: 'Abraham Hicks'
            },
            sections: [
              {
                title: 'De Transformatie Formule',
                type: 'text',
                content: 'Nu je de pijn van je beperkende overtuiging hebt gevoeld, is het tijd om deze te vervangen. Dit gebeurt in drie stappen:\n\n1. ONDERBREEK het oude patroon\n2. CREËER nieuwe referenties\n3. VERSTERK de nieuwe overtuiging'
              },
              {
                title: 'Stap 1: Pattern Interrupt',
                type: 'text',
                content: 'Elke keer dat de oude overtuiging opkomt, onderbreek je het patroon. Roep "STOP!" (hardop of in je hoofd), verander je fysiologie, en redirect je focus.\n\nDit verzwakt de neurale verbinding van de oude overtuiging.'
              },
              {
                title: 'Stap 2: Nieuwe Referenties',
                type: 'list',
                content: 'Bouw poten onder je nieuwe overtuiging:',
                items: [
                  'Zoek bewijs uit je verleden dat de nieuwe overtuiging ondersteunt',
                  'Zoek rolmodellen die bewijzen dat de nieuwe overtuiging waar kan zijn',
                  'Creëer nieuwe ervaringen die als bewijs dienen',
                  'Herframe oude ervaringen - geef ze een nieuwe betekenis'
                ]
              },
              {
                title: 'Stap 3: Versterking',
                type: 'text',
                content: 'Spreek je nieuwe overtuiging dagelijks uit als incantation. Visualiseer jezelf als iemand die deze overtuiging belichaamt. Vier elk klein bewijs dat de nieuwe overtuiging ondersteunt.'
              }
            ],
            reflection_questions: [
              {
                key: 'new_belief',
                question: 'Wat is de nieuwe, versterkende overtuiging die je oude vervangt?',
                type: 'textarea',
                placeholder: 'Ik geloof nu dat...'
              },
              {
                key: 'past_evidence',
                question: 'Welk bewijs uit je verleden ondersteunt deze nieuwe overtuiging?',
                type: 'textarea'
              },
              {
                key: 'role_models',
                question: 'Wie zijn 2-3 mensen die bewijzen dat deze overtuiging waar kan zijn?',
                type: 'textarea'
              }
            ]
          }
        }
      ]
    },
    // MODULE 3: NEEDS
    {
      slug: 'needs',
      title: 'Needs',
      subtitle: 'De 6 Menselijke Behoeften',
      description: 'Begrijp de fundamentele drijfveren achter al je gedrag en leer hoe je ze op constructieve wijze kunt vervullen.',
      week_start: 5,
      week_end: 6,
      icon: 'heart',
      color: 'pink',
      lessons: [
        {
          slug: 'de-6-behoeften',
          title: 'De 6 Menselijke Behoeften',
          subtitle: 'Begrijp Wat Je Drijft',
          lesson_type: 'theory',
          estimated_minutes: 18,
          content: {
            intro: {
              quote: 'Alles wat je doet, doe je om aan een behoefte te voldoen. Er zijn geen uitzonderingen.',
              quote_author: 'Tony Robbins',
              text: 'Tony Robbins identificeerde 6 fundamentele behoeften die AL ons gedrag aansturen. Begrijp deze behoeften, en je begrijpt jezelf en anderen op een dieper niveau.'
            },
            sections: [
              {
                title: 'De 4 Behoeften van de Persoonlijkheid',
                type: 'list',
                content: 'Deze behoeften zijn gericht op overleven en comfort:',
                items: [
                  'ZEKERHEID - De behoefte aan veiligheid, stabiliteit en voorspelbaarheid',
                  'VARIATIE - De behoefte aan verandering, uitdaging en nieuwe ervaringen',
                  'SIGNIFICANTIE - De behoefte om je speciaal, uniek en belangrijk te voelen',
                  'VERBINDING/LIEFDE - De behoefte aan intimiteit en connectie met anderen'
                ]
              },
              {
                title: 'De 2 Behoeften van de Geest',
                type: 'list',
                content: 'Deze behoeften leiden tot echte vervulling:',
                items: [
                  'GROEI - De behoefte om te leren, te ontwikkelen en beter te worden',
                  'BIJDRAGE - De behoefte om bij te dragen en verschil te maken voor anderen'
                ]
              },
              {
                type: 'callout',
                style: 'info',
                title: 'Het Geheim van Vervulling',
                content: 'De eerste 4 behoeften kun je op ongezonde manieren vervullen (drugs voor variatie, pesten voor significantie). Maar Groei en Bijdrage - de behoeften van de geest - leiden altijd tot positieve uitkomsten.'
              },
              {
                title: 'Je Top 2',
                type: 'text',
                content: 'Iedereen heeft alle 6 behoeften, maar je TOP 2 behoeften sturen 95% van je gedrag aan. Ken je top 2, en je begrijpt waarom je doet wat je doet.\n\nIs Zekerheid je #1? Dan zoek je stabiliteit, vermijd je risico\'s.\nIs Significantie je #1? Dan zoek je erkenning, wil je speciaal zijn.\nIs Groei je #1? Dan ben je constant aan het leren, nooit tevreden met stilstand.'
              }
            ],
            reflection_questions: [
              {
                key: 'initial_guess',
                question: 'Wat denk je dat jouw top 2 behoeften zijn?',
                type: 'textarea'
              }
            ]
          }
        },
        {
          slug: 'behoeften-assessment',
          title: 'Jouw Behoeften Assessment',
          subtitle: 'Ontdek Je Top 2',
          lesson_type: 'assessment',
          estimated_minutes: 15,
          content: {
            intro: {
              text: 'In dit assessment ontdek je welke van de 6 behoeften jou het meest aansturen. Beantwoord eerlijk - er zijn geen goede of foute antwoorden.'
            },
            exercises: [
              {
                type: 'six_needs',
                title: 'Six Human Needs Assessment',
                description: 'Ontdek je primaire behoeften door eerlijk te antwoorden op de vragen.'
              }
            ]
          }
        },
        {
          slug: 'vehicles-analysis',
          title: 'Vehicles Analysis',
          subtitle: 'Hoe Vervul Je Je Behoeften?',
          lesson_type: 'reflection',
          estimated_minutes: 15,
          content: {
            intro: {
              quote: 'Het probleem is nooit de behoefte. Het probleem is het voertuig dat je gebruikt om de behoefte te vervullen.',
              quote_author: 'Tony Robbins'
            },
            sections: [
              {
                title: 'Constructief vs Destructief',
                type: 'text',
                content: 'Je kunt elke behoefte op een constructieve of destructieve manier vervullen:\n\nSIGNIFICANTIE constructief: anderen helpen, uitblinken in je werk\nSIGNIFICANTIE destructief: opscheppen, anderen kleineren, geweld\n\nZEKERHEID constructief: sparen, plannen, gezonde routine\nZEKERHEID destructief: controlling gedrag, vermijding, obsessief gedrag'
              }
            ],
            reflection_questions: [
              {
                key: 'vehicles_certainty',
                question: 'Hoe vervul je momenteel je behoefte aan ZEKERHEID? Is dit constructief?',
                type: 'textarea'
              },
              {
                key: 'vehicles_variety',
                question: 'Hoe vervul je je behoefte aan VARIATIE?',
                type: 'textarea'
              },
              {
                key: 'vehicles_significance',
                question: 'Hoe vervul je je behoefte aan SIGNIFICANTIE?',
                type: 'textarea'
              },
              {
                key: 'vehicles_connection',
                question: 'Hoe vervul je je behoefte aan VERBINDING?',
                type: 'textarea'
              },
              {
                key: 'destructive_vehicle',
                question: 'Welk "voertuig" zou je willen vervangen door iets constructievers?',
                type: 'textarea'
              }
            ]
          }
        }
      ]
    },
    // MODULE 4: VISION
    {
      slug: 'vision',
      title: 'Vision',
      subtitle: 'RPM & Massive Action',
      description: 'Creëer een overtuigende visie voor je leven en leer het RPM-systeem voor focus en actie.',
      week_start: 7,
      week_end: 8,
      icon: 'target',
      color: 'green',
      lessons: [
        {
          slug: 'visie-creeren',
          title: 'Visie Creëren',
          subtitle: 'Je Leven Over 10 Jaar',
          lesson_type: 'reflection',
          estimated_minutes: 20,
          content: {
            intro: {
              quote: 'Mensen overschatten wat ze in een jaar kunnen doen, maar onderschatten wat ze in 10 jaar kunnen bereiken.',
              quote_author: 'Tony Robbins'
            },
            sections: [
              {
                title: 'De Kracht van Visie',
                type: 'text',
                content: 'Een duidelijke, emotioneel overtuigende visie is als een magneet. Het trekt je vooruit, geeft richting aan je beslissingen, en zorgt dat je door obstakels heen breekt.\n\nZonder visie reageer je alleen op wat er gebeurt. Met visie creëer je actief je toekomst.'
              }
            ],
            reflection_questions: [
              {
                key: 'vision_10_years',
                question: 'Beschrijf je leven over 10 jaar als ALLES perfect zou verlopen. Waar woon je? Met wie? Wat doe je voor werk? Hoe voelt het?',
                type: 'textarea',
                placeholder: 'Wees specifiek en gedetailleerd...'
              },
              {
                key: 'vision_feeling',
                question: 'Welke emotie overheerst als je dit visualiseert?',
                type: 'text'
              },
              {
                key: 'must_happen',
                question: 'Wat MOET er absoluut gebeuren in de komende 10 jaar om je leven succesvol te noemen?',
                type: 'textarea'
              }
            ]
          }
        },
        {
          slug: 'rpm-systeem',
          title: 'Het RPM Systeem',
          subtitle: 'Results-Purpose-Massive Action',
          lesson_type: 'theory',
          estimated_minutes: 15,
          content: {
            intro: {
              quote: 'Weten wat je wilt is niet genoeg. Je moet weten WAAROM je het wilt, en dan MASSALE actie ondernemen.',
              quote_author: 'Tony Robbins'
            },
            sections: [
              {
                title: 'R - Results (Resultaat)',
                type: 'text',
                content: 'Begin met het einde in gedachten. Wat wil je precies bereiken? Wees specifiek. "Meer geld verdienen" is vaag. "€10.000 per maand verdienen met mijn consultancy tegen december" is specifiek.'
              },
              {
                title: 'P - Purpose (Doel/Waarom)',
                type: 'text',
                content: 'Dit is de BELANGRIJKSTE stap. Waarom wil je dit? Wat geeft het je? Hoe zal het je leven veranderen?\n\nJe Purpose moet zo overtuigend zijn dat het je uit bed sleurt op de dagen dat je geen zin hebt. Het moet emotioneel geladen zijn.'
              },
              {
                title: 'M - Massive Action Plan',
                type: 'text',
                content: 'Welke acties moet je ondernemen om het resultaat te bereiken? Niet 3 acties - 20, 30, 50 acties. Brainstorm alles wat mogelijk zou kunnen werken.\n\nDan prioriteer: wat zijn de 20% van de acties die 80% van de resultaten opleveren?'
              }
            ],
            reflection_questions: [
              {
                key: 'rpm_result',
                question: 'Kies één belangrijk doel. Wat is het specifieke RESULTAAT dat je wilt?',
                type: 'textarea'
              },
              {
                key: 'rpm_purpose',
                question: 'WAAROM wil je dit? Geef minstens 5 redenen.',
                type: 'textarea',
                placeholder: '1. Omdat...\n2. Omdat...\n3. Omdat...\n4. Omdat...\n5. Omdat...'
              },
              {
                key: 'rpm_actions',
                question: 'Welke ACTIES kun je ondernemen? Noem er minstens 10.',
                type: 'textarea'
              }
            ]
          }
        },
        {
          slug: 'wheel-of-life',
          title: 'Wheel of Life',
          subtitle: 'Balans in Alle Gebieden',
          lesson_type: 'assessment',
          estimated_minutes: 15,
          content: {
            intro: {
              text: 'Het Wheel of Life helpt je te zien waar je staat in elk belangrijk levensgebied, en waar de meeste aandacht nodig is.'
            },
            exercises: [
              {
                type: 'wheel_of_life',
                title: 'Wheel of Life Assessment',
                description: 'Score elk gebied van je leven van 1-10 op basis van je huidige tevredenheid.'
              }
            ],
            reflection_questions: [
              {
                key: 'wheel_focus',
                question: 'Welk gebied, als je het verbetert, zou automatisch andere gebieden verbeteren?',
                type: 'textarea'
              }
            ]
          }
        }
      ]
    },
    // MODULE 5: BREAKTHROUGH
    {
      slug: 'breakthrough',
      title: 'Breakthrough',
      subtitle: 'Doorbraken Forceren',
      description: 'Leer technieken om angsten te overwinnen, patronen te doorbreken en je comfort zone uit te breiden.',
      week_start: 9,
      week_end: 10,
      icon: 'flame',
      color: 'orange',
      lessons: [
        {
          slug: 'nac',
          title: 'Neuro-Associative Conditioning',
          subtitle: 'Pijn en Plezier Herprogrammeren',
          lesson_type: 'theory',
          estimated_minutes: 15,
          content: {
            intro: {
              quote: 'We worden niet gedreven door de werkelijkheid, maar door onze PERCEPTIE van de werkelijkheid.',
              quote_author: 'Tony Robbins'
            },
            sections: [
              {
                title: 'Het Principe',
                type: 'text',
                content: 'Alles wat je doet, doe je om pijn te vermijden of plezier te ervaren. Dit is de basis van al je gedrag.\n\nWaarom stel je dingen uit? Omdat je meer pijn associeert met actie dan met uitstel.\nWaarom kun je niet stoppen met een slechte gewoonte? Omdat je er plezier aan koppelt.\n\nVerander de associaties, verander het gedrag.'
              },
              {
                title: 'De 6 Stappen van NAC',
                type: 'list',
                content: '',
                items: [
                  '1. Besluit wat je echt wilt en wat je tegenhoudt',
                  '2. Creëer LEVERAGE - associeer massive pijn aan niet veranderen',
                  '3. Onderbreek het limiterende patroon',
                  '4. Creëer een nieuw, empowering alternatief',
                  '5. Conditioneer het nieuwe patroon tot het automatisch is',
                  '6. Test het - werkt het in stressvolle situaties?'
                ]
              }
            ],
            reflection_questions: [
              {
                key: 'change_target',
                question: 'Welk gedrag of patroon wil je veranderen met NAC?',
                type: 'textarea'
              },
              {
                key: 'current_associations',
                question: 'Welke pijn vermijd je door dit gedrag te behouden? Welk plezier geeft het je?',
                type: 'textarea'
              }
            ]
          }
        },
        {
          slug: 'angst-inventaris',
          title: 'Angst Inventaris',
          subtitle: 'Ken Je Vijanden',
          lesson_type: 'reflection',
          estimated_minutes: 20,
          content: {
            intro: {
              quote: 'De grootte van je leven is direct evenredig aan de grootte van de angsten die je bereid bent te confronteren.',
              quote_author: 'Tony Robbins'
            },
            sections: [
              {
                title: 'Angst is Informatie',
                type: 'text',
                content: 'Angst is niet je vijand - onbekendheid met je angsten is je vijand. Als je exact weet waar je bang voor bent, kun je er iets aan doen.'
              }
            ],
            reflection_questions: [
              {
                key: 'fear_rejection',
                question: 'Welke angsten heb je rond AFWIJZING?',
                type: 'textarea'
              },
              {
                key: 'fear_failure',
                question: 'Welke angsten heb je rond FALEN?',
                type: 'textarea'
              },
              {
                key: 'fear_success',
                question: 'Welke angsten heb je rond SUCCES? (Ja, dit bestaat)',
                type: 'textarea'
              },
              {
                key: 'fear_loss',
                question: 'Welke angsten heb je rond VERLIES (geld, relaties, gezondheid)?',
                type: 'textarea'
              },
              {
                key: 'biggest_fear',
                question: 'Wat is je allergrootste angst, die je het meest tegenhoudt?',
                type: 'textarea'
              },
              {
                key: 'fear_confrontation',
                question: 'Wat zou er gebeuren als je deze angst MORGEN zou confronteren?',
                type: 'textarea'
              }
            ]
          }
        },
        {
          slug: 'comfort-zone-expansion',
          title: 'Comfort Zone Expansion',
          subtitle: 'Dagelijkse Micro-uitdagingen',
          lesson_type: 'exercise',
          estimated_minutes: 10,
          content: {
            intro: {
              quote: 'Het leven begint waar je comfort zone eindigt.',
              quote_author: 'Neale Donald Walsch'
            },
            sections: [
              {
                title: 'De 2% Regel',
                type: 'text',
                content: 'Je hoeft geen grote, dramatische dingen te doen om je comfort zone uit te breiden. Elke dag 2% verder gaan is genoeg.\n\nDit kan zo simpel zijn als een vreemde groeten, een vraag stellen in een meeting, of je mening geven wanneer je dat normaal niet zou doen.'
              },
              {
                title: 'Comfort Zone Challenges',
                type: 'list',
                content: 'Ideeën voor deze week:',
                items: [
                  'Neem een koude douche (1-2 minuten)',
                  'Spreek een vreemde aan en geef een compliment',
                  'Deel een mening op social media waar je normaal niet over zou posten',
                  'Bel iemand op in plaats van appen',
                  'Vraag om korting ergens',
                  'Doe een workout in het openbaar',
                  'Deel een fout die je hebt gemaakt met iemand'
                ]
              }
            ],
            commitments: [
              'Ik doe deze week elke dag minimaal één ding buiten mijn comfort zone',
              'Ik log mijn comfort zone challenges en hoe het voelde'
            ]
          }
        }
      ]
    },
    // MODULE 6: MASTERY
    {
      slug: 'mastery',
      title: 'Mastery',
      subtitle: 'Integratie & Levenslang Leren',
      description: 'Integreer alles wat je hebt geleerd in duurzame gewoontes en rituelen voor een leven van constante groei.',
      week_start: 11,
      week_end: 12,
      icon: 'star',
      color: 'amber',
      lessons: [
        {
          slug: 'values-hierarchy',
          title: 'Values Hierarchy',
          subtitle: 'Je Top 10 Waarden',
          lesson_type: 'reflection',
          estimated_minutes: 20,
          content: {
            intro: {
              quote: 'Het is niet moeilijk om beslissingen te nemen als je weet wat je waarden zijn.',
              quote_author: 'Roy Disney'
            },
            sections: [
              {
                title: 'Waarom Waarden?',
                type: 'text',
                content: 'Je waarden zijn je kompas. Ze bepalen welke beslissingen goed voelen en welke niet. Interne conflicten ontstaan vaak wanneer je waarden botsen.\n\nAls "avontuur" en "zekerheid" allebei hoog staan, krijg je interne strijd bij elke grote beslissing.'
              },
              {
                title: 'Moving Towards vs Moving Away',
                type: 'text',
                content: 'Er zijn twee soorten waarden:\n\nMOVING TOWARDS - Dingen die je wilt ervaren (liefde, vrijheid, succes)\nMOVING AWAY - Dingen die je wilt vermijden (afwijzing, falen, eenzaamheid)\n\nBeide sturen je gedrag, maar op verschillende manieren.'
              }
            ],
            reflection_questions: [
              {
                key: 'towards_values',
                question: 'Wat zijn de 10 belangrijkste dingen die je wilt ERVAREN in je leven? Rangschik ze van belangrijk naar meest belangrijk.',
                type: 'textarea',
                placeholder: '1. (belangrijkst)\n2.\n3.\n4.\n5.\n6.\n7.\n8.\n9.\n10.'
              },
              {
                key: 'away_values',
                question: 'Wat zijn de 10 dingen die je het meest wilt VERMIJDEN?',
                type: 'textarea'
              },
              {
                key: 'values_conflict',
                question: 'Zie je conflicten tussen je waarden die interne strijd kunnen veroorzaken?',
                type: 'textarea'
              }
            ]
          }
        },
        {
          slug: 'rules-audit',
          title: 'Rules Audit',
          subtitle: 'Je Onbewuste Regels',
          lesson_type: 'reflection',
          estimated_minutes: 15,
          content: {
            intro: {
              quote: 'De meeste mensen maken regels voor geluk die onmogelijk te bereiken zijn, en regels voor ongeluk die onmogelijk te vermijden zijn.',
              quote_author: 'Tony Robbins'
            },
            sections: [
              {
                title: 'Wat Zijn Regels?',
                type: 'text',
                content: '"Ik voel me succesvol ALS..."\n"Ik ben gelukkig WANNEER..."\n\nDit zijn je regels. Ze bepalen wat er moet gebeuren voor jij je een bepaalde emotie mag voelen.\n\nSommige mensen hebben regels als: "Ik ben gelukkig als IEDEREEN van me houdt." Onmogelijk te bereiken = onmogelijk gelukkig te zijn.'
              }
            ],
            reflection_questions: [
              {
                key: 'happiness_rules',
                question: 'Wat moet er gebeuren voor JIJ je gelukkig mag voelen?',
                type: 'textarea'
              },
              {
                key: 'success_rules',
                question: 'Wat moet er gebeuren voor jij je succesvol mag voelen?',
                type: 'textarea'
              },
              {
                key: 'love_rules',
                question: 'Wat moet er gebeuren voor jij je geliefd mag voelen?',
                type: 'textarea'
              },
              {
                key: 'easier_rules',
                question: 'Hoe zou je je regels kunnen veranderen zodat het MAKKELIJKER wordt om positieve emoties te voelen?',
                type: 'textarea'
              }
            ]
          }
        },
        {
          slug: 'morning-evening-rituals',
          title: 'Morning & Evening Rituals',
          subtitle: 'Je Ultieme Dagelijkse Routine',
          lesson_type: 'exercise',
          estimated_minutes: 15,
          content: {
            intro: {
              quote: 'Je zult nooit je leven veranderen totdat je iets verandert dat je dagelijks doet. Het geheim van je succes zit in je dagelijkse routine.',
              quote_author: 'John C. Maxwell'
            },
            sections: [
              {
                title: 'Ontwerp Je Ochtend',
                type: 'text',
                content: 'Een krachtige ochtend bevat:\n- Priming/meditatie\n- Beweging\n- Leren (lezen, podcast)\n- Planning (top 3 prioriteiten)\n\nDe volgorde maakt niet zoveel uit - consistentie wel.'
              },
              {
                title: 'Ontwerp Je Avond',
                type: 'text',
                content: 'Een krachtige avond bevat:\n- Reflectie op de dag\n- Dankbaarheid\n- Planning voor morgen\n- Ontspanning zonder schermen\n\nHoe je dag eindigt bepaalt hoe je slaap is. Hoe je slaap is bepaalt je volgende dag.'
              }
            ],
            reflection_questions: [
              {
                key: 'morning_ritual',
                question: 'Ontwerp je ideale ochtendritueel. Wat doe je, in welke volgorde, hoelang?',
                type: 'textarea'
              },
              {
                key: 'evening_ritual',
                question: 'Ontwerp je ideale avondritueel.',
                type: 'textarea'
              },
              {
                key: 'start_date',
                question: 'Op welke datum begin je met je nieuwe rituelen?',
                type: 'text'
              }
            ],
            commitments: [
              'Ik implementeer mijn nieuwe ochtendritueel vanaf de gekozen startdatum',
              'Ik evalueer na 2 weken wat werkt en wat ik moet aanpassen'
            ]
          }
        },
        {
          slug: 'integration-ceremony',
          title: 'Integration Ceremony',
          subtitle: 'Je Nieuwe Identiteit',
          lesson_type: 'reflection',
          estimated_minutes: 20,
          content: {
            intro: {
              quote: 'De enige manier om je leven te veranderen is door te veranderen wie je BENT.',
              quote_author: 'Tony Robbins',
              text: 'Gefeliciteerd. Je hebt 12 weken van intense groei doorgemaakt. Nu is het tijd om alles samen te brengen en je nieuwe identiteit te claimen.'
            },
            sections: [
              {
                title: 'Reflectie op de Reis',
                type: 'text',
                content: 'Neem even de tijd om terug te kijken:\n- Je hebt geleerd je staat te managen met de Triad\n- Je hebt beperkende overtuigingen doorbroken\n- Je begrijpt je fundamentele behoeften\n- Je hebt een visie gecreëerd met RPM\n- Je hebt doorbraken geforceerd\n- Je bent begonnen met duurzame rituelen'
              },
              {
                type: 'callout',
                style: 'success',
                title: 'Je Bent Niet Dezelfde Persoon',
                content: 'De persoon die aan deze cursus begon is niet dezelfde als de persoon die hem afmaakt. Je hebt tools, inzichten en ervaringen die je leven permanent hebben veranderd.'
              }
            ],
            reflection_questions: [
              {
                key: 'biggest_insight',
                question: 'Wat is het grootste inzicht dat je in deze 12 weken hebt opgedaan?',
                type: 'textarea'
              },
              {
                key: 'belief_transformed',
                question: 'Welke beperkende overtuiging heb je het meest getransformeerd?',
                type: 'textarea'
              },
              {
                key: 'new_identity',
                question: 'Wie BEN je nu? Beschrijf je nieuwe identiteit in 3-5 zinnen.',
                type: 'textarea',
                placeholder: 'Ik ben iemand die...'
              },
              {
                key: 'commitment_forward',
                question: 'Wat beloof je jezelf voor de komende 12 maanden?',
                type: 'textarea'
              },
              {
                key: 'gratitude_self',
                question: 'Wat waardeer je aan jezelf voor het voltooien van deze reis?',
                type: 'textarea'
              }
            ],
            closing: {
              quote: 'Het zijn jouw momenten van beslissingen die je bestemming vormgeven.',
              quote_author: 'Tony Robbins',
              next_steps: 'Dit is niet het einde - het is het begin. Blijf primen, blijf groeien, blijf bijdragen. Je bent Unleashed.'
            }
          }
        }
      ]
    }
  ]
};

/**
 * SQL to seed the course
 * Run this against your database to populate the course
 */
export const generateSeedSQL = () => {
  const course = UNLEASHED_COURSE;
  const statements: string[] = [];

  // Insert course
  statements.push(`
    INSERT INTO courses (slug, title, subtitle, description, image_url, total_modules, total_lessons, estimated_weeks, difficulty, is_published)
    VALUES (
      '${course.slug}',
      '${course.title}',
      '${course.subtitle}',
      '${course.description?.replace(/'/g, "''")}',
      ${course.image_url ? `'${course.image_url}'` : 'NULL'},
      ${course.modules.length},
      ${course.modules.reduce((acc, m) => acc + m.lessons.length, 0)},
      ${course.estimated_weeks},
      '${course.difficulty}',
      true
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      description = EXCLUDED.description,
      total_modules = EXCLUDED.total_modules,
      total_lessons = EXCLUDED.total_lessons;
  `);

  // Insert modules and lessons
  course.modules.forEach((module, moduleIndex) => {
    statements.push(`
      INSERT INTO course_modules (course_id, slug, title, subtitle, description, week_start, week_end, order_index, icon, color)
      SELECT id, '${module.slug}', '${module.title}', '${module.subtitle || ''}', '${module.description?.replace(/'/g, "''") || ''}', ${module.week_start}, ${module.week_end}, ${moduleIndex + 1}, '${module.icon}', '${module.color}'
      FROM courses WHERE slug = '${course.slug}'
      ON CONFLICT (course_id, slug) DO UPDATE SET
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        description = EXCLUDED.description;
    `);

    module.lessons.forEach((lesson, lessonIndex) => {
      const contentJson = JSON.stringify(lesson.content).replace(/'/g, "''");
      statements.push(`
        INSERT INTO course_lessons (module_id, slug, title, subtitle, lesson_type, content, estimated_minutes, order_index)
        SELECT cm.id, '${lesson.slug}', '${lesson.title}', '${lesson.subtitle || ''}', '${lesson.lesson_type}', '${contentJson}'::jsonb, ${lesson.estimated_minutes}, ${lessonIndex + 1}
        FROM course_modules cm
        JOIN courses c ON cm.course_id = c.id
        WHERE c.slug = '${course.slug}' AND cm.slug = '${module.slug}'
        ON CONFLICT (module_id, slug) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content;
      `);
    });
  });

  return statements.join('\n');
};
