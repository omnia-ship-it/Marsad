// ---------------------------------------------------------------
// API keys — paste your own values here.
// Don't commit this file to a public repo with real keys inside.
// ---------------------------------------------------------------

// TheSportsDB free public test key
var sportsApiKey = '3'
var leagueId = '4328' // English Premier League (used for "Latest results" on the home page)

// football-data.org (free: 10 requests/minute) — standings, fixtures, live matches
var footballDataToken = '95e4ca8fd9f4406e89f6d6ccfeecdef2'

// API-Football (free: 100 requests/day) — top scorers and cards
var apiFootballKey = '77cbfcef6963f5173718b5f306dc486f'
var apiFootballLeagueId = '39' // English Premier League
var apiFootballSeason = '2023' // Free plan only covers past completed seasons

// ---------------------------------------------------------------
// Leagues shown in the dropdowns on Standings and Fixtures (TheSportsDB ids).
// Check the ids at thesportsdb.com if a league shows no data.
// ---------------------------------------------------------------
var LEAGUES = {
    PL: { name: 'Premier League', sportsDbId: '4328' },
    PD: { name: 'La Liga', sportsDbId: '4335' },
    EGY: { name: 'Egyptian Premier League', sportsDbId: '4829' }
}

// ---------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------

// Home page + Stats page
async function getSportsData() {
    if (document.querySelector('#live-matches .ki-matches-list')) getLiveOrRecentMatches(leagueId)
    if (document.querySelector('#topScorersList')) getTopScorers()
    if (document.querySelector('#yellowCardsList')) getTopYellowCards()
    if (document.querySelector('#redCardsList')) getTopRedCards()
}

// Standings page
function initStandingsPage() {
    var select = document.querySelector('#league')
    select.addEventListener('change', function () {
        getStandings(select.value)
    })
    getStandings(select.value)
}

// Fixtures page
function initFixturesPage() {
    var select = document.querySelector('#league')
    var dateFrom = document.querySelector('#dateFrom')
    var dateTo = document.querySelector('#dateTo')

    // Default range: today -> 10 days ahead
    var today = new Date()
    var later = new Date()
    later.setDate(today.getDate() + 10)
    dateFrom.value = toISODate(today)
    dateTo.value = toISODate(later)

    var reload = function () {
        getFixtures(select.value, dateFrom.value, dateTo.value)
    }
    select.addEventListener('change', reload)
    dateFrom.addEventListener('change', reload)
    dateTo.addEventListener('change', reload)
    reload()
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function toISODate(date) {
    var y = date.getFullYear()
    var m = String(date.getMonth() + 1).padStart(2, '0')
    var d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

// Football seasons start in August: Oct 2026 -> "2026-2027", Mar 2027 -> "2026-2027"
function currentSeasonString() {
    var now = new Date()
    var startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
    return `${startYear}-${startYear + 1}`
}

function previousSeasonString() {
    var start = parseInt(currentSeasonString().split('-')[0], 10) - 1
    return `${start}-${start + 1}`
}

async function footballDataGet(path) {
    var response = await fetch(`https://api.football-data.org/v4/${path}`, {
        headers: { 'X-Auth-Token': footballDataToken }
    })
    if (!response.ok) throw new Error(`football-data.org returned ${response.status}`)
    return response.json()
}

// ---------------------------------------------------------------
// Standings
// ---------------------------------------------------------------
async function getStandings($leagueKey) {
    var league = LEAGUES[$leagueKey]
    var tbody = document.querySelector('#standingsTable tbody')
    tbody.innerHTML = '<tr><td colspan="8" class="text-muted py-3">Loading...</td></tr>'

    try {
        var rows = await fetchStandingsSportsDb(league.sportsDbId, currentSeasonString())

        // If the new season has no table yet, fall back to the previous season
        if (rows.length === 0) {
            rows = await fetchStandingsSportsDb(league.sportsDbId, previousSeasonString())
        }

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-muted py-3">No standings available right now.</td></tr>'
            return
        }

        tbody.innerHTML = ''
        rows.forEach(function (team) {
            var row = document.createElement('tr')
            row.innerHTML = `
                <td>${team.rank}</td>
                <td class="text-start">${team.name}</td>
                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.draw}</td>
                <td>${team.lost}</td>
                <td>${team.goalDifference}</td>
                <td><b>${team.points}</b></td>
            `
            tbody.appendChild(row)
        })
    } catch (error) {
        console.warn('Standings failed:', error)
        tbody.innerHTML = '<tr><td colspan="8" class="text-muted py-3">Could not load standings. Try again in a minute.</td></tr>'
    }
}

async function fetchStandingsSportsDb($id, $season) {
    var url = `https://www.thesportsdb.com/api/v1/json/${sportsApiKey}/lookuptable.php?l=${$id}&s=${$season}`
    var response = await fetch(url)
    var data = await response.json()
    if (!data.table) return []
    return data.table.map(function (t) {
        return {
            rank: t.intRank,
            name: t.strTeam,
            played: t.intPlayed,
            won: t.intWin,
            draw: t.intDraw,
            lost: t.intLoss,
            goalDifference: t.intGoalDifference,
            points: t.intPoints
        }
    })
}

// ---------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------
async function getFixtures($leagueKey, $dateFrom, $dateTo) {
    var league = LEAGUES[$leagueKey]
    var container = document.querySelector('#fixturesList')
    container.innerHTML = '<p class="text-muted small mb-0">Loading...</p>'

    if ($dateFrom && $dateTo && $dateFrom > $dateTo) {
        container.innerHTML = '<p class="text-muted small mb-0">"Date from" must be before "Date to".</p>'
        return
    }

    try {
        var fixtures = await fetchFixturesSportsDb(league.sportsDbId, $dateFrom, $dateTo)

        if (fixtures.length === 0) {
            container.innerHTML = '<p class="text-muted small mb-0">No fixtures found for these dates.</p>'
            return
        }

        container.innerHTML = ''
        fixtures.forEach(function (fixture) {
            var card = document.createElement('div')
            card.classList.add('ki-fixture')
            card.innerHTML = `
                <small>${fixture.dateLabel}</small>
                <div class="ki-match">
                    <span>${fixture.home}</span>
                    <b>${fixture.time}</b>
                    <span>${fixture.away}</span>
                </div>
            `
            container.appendChild(card)
        })
    } catch (error) {
        console.warn('Fixtures failed:', error)
        container.innerHTML = '<p class="text-muted small mb-0">Could not load fixtures. Try again in a minute.</p>'
    }
}

// TheSportsDB's free key returns the next 15 and the last 15 events of a league,
// so we merge both lists and filter them by the chosen dates.
async function fetchFixturesSportsDb($id, $dateFrom, $dateTo) {
    var base = `https://www.thesportsdb.com/api/v1/json/${sportsApiKey}`
    var responses = await Promise.all([
        fetch(`${base}/eventsnextleague.php?id=${$id}`).then(function (r) { return r.json() }),
        fetch(`${base}/eventspastleague.php?id=${$id}`).then(function (r) { return r.json() })
    ])

    var events = []
    var seen = {}
    responses.forEach(function (data) {
        (data.events || []).forEach(function (e) {
            if (!seen[e.idEvent]) {
                seen[e.idEvent] = true
                events.push(e)
            }
        })
    })

    return events
        .filter(function (e) {
            return (!$dateFrom || e.dateEvent >= $dateFrom) && (!$dateTo || e.dateEvent <= $dateTo)
        })
        .sort(function (a, b) {
            return (a.dateEvent + (a.strTime || '')).localeCompare(b.dateEvent + (b.strTime || ''))
        })
        .map(function (e) {
            var day = new Date(e.dateEvent)
            var hasScore = e.intHomeScore !== null && e.intHomeScore !== undefined && e.intHomeScore !== ''
            return {
                dateLabel: day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
                time: hasScore ? `${e.intHomeScore} : ${e.intAwayScore}` : (e.strTime ? e.strTime.substring(0, 5) : 'TBD'),
                home: e.strHomeTeam,
                away: e.strAwayTeam
            }
        })
}

// ---------------------------------------------------------------
// Home page: live matches / latest results
// ---------------------------------------------------------------
async function getLiveOrRecentMatches($leagueId) {
    var shownLive = await getLiveMatches()
    if (!shownLive) {
        getRecentResults($leagueId)
    }
}

async function getLiveMatches() {
    try {
        var data = await footballDataGet('matches?status=LIVE')
        if (!data.matches || data.matches.length === 0) return false

        var heading = document.querySelector('#live-matches h4')
        var container = document.querySelector('#live-matches .ki-matches-list')

        heading.innerHTML = '<span class="ki-live-dot"></span> Live matches'
        container.innerHTML = ''

        data.matches.slice(0, 5).forEach(function (match) {
            var row = document.createElement('div')
            row.classList.add('ki-match')
            row.innerHTML = `
                <span>${match.homeTeam.shortName || match.homeTeam.name}</span>
                <b>${match.score.fullTime.home ?? 0} : ${match.score.fullTime.away ?? 0}</b>
                <span>${match.awayTeam.shortName || match.awayTeam.name}</span>
            `
            container.appendChild(row)
        })

        return true
    } catch (error) {
        console.warn('Live matches unavailable (falling back to recent results):', error)
        return false
    }
}

async function getRecentResults($leagueId) {
    var url = `https://www.thesportsdb.com/api/v1/json/${sportsApiKey}/eventspastleague.php?id=${$leagueId}`

    var response = await fetch(url)
    var data = await response.json()

    var container = document.querySelector('#live-matches .ki-matches-list')
    if (!data.events) return
    container.innerHTML = ''

    data.events.slice(0, 3).forEach(function (event) {
        var row = document.createElement('div')
        row.classList.add('ki-match')
        row.innerHTML = `
            <span>${event.strHomeTeam}</span>
            <b>${event.intHomeScore} : ${event.intAwayScore}</b>
            <span>${event.strAwayTeam}</span>
        `
        container.appendChild(row)
    })
}

// ---------------------------------------------------------------
// Stats page
// ---------------------------------------------------------------
async function getApiFootballStat($endpoint, $listId, $valueGetter) {
    var list = document.querySelector(`#${$listId}`)

    try {
        var url = `https://v3.football.api-sports.io/players/${$endpoint}?league=${apiFootballLeagueId}&season=${apiFootballSeason}`
        var response = await fetch(url, {
            headers: { 'x-apisports-key': apiFootballKey }
        })
        var data = await response.json()

        if (!data.response || data.response.length === 0) {
            list.innerHTML = '<li class="text-muted small">No data available right now.</li>'
            return
        }

        list.innerHTML = ''

        data.response.slice(0, 4).forEach(function (entry) {
            var li = document.createElement('li')
            li.innerHTML = `<span>${entry.player.name}</span><b>${$valueGetter(entry)}</b>`
            list.appendChild(li)
        })
    } catch (error) {
        console.warn(`API-Football request failed for ${$endpoint}:`, error)
        list.innerHTML = '<li class="text-muted small">No data available right now.</li>'
    }
}

function getTopScorers() {
    getApiFootballStat('topscorers', 'topScorersList', function (entry) {
        return entry.statistics[0].goals.total
    })
}

function getTopYellowCards() {
    getApiFootballStat('topyellowcards', 'yellowCardsList', function (entry) {
        return entry.statistics[0].cards.yellow
    })
}

function getTopRedCards() {
    getApiFootballStat('topredcards', 'redCardsList', function (entry) {
        return entry.statistics[0].cards.red
    })
}