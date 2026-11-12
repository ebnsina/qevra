// The free study sheets on the Resources page. Each becomes a PDF when the seed runs.
const verbs = (list: string) => list.trim().split('\n').map((row) => row.split(',').map((cell) => cell.trim()));

export const resources = [
	{
		key: 'public/resources/regular-verbs.pdf',
		title: 'Regular Verbs',
		description: 'Essential regular verbs you must know: simple, clean, and easy to remember.',
		note: 'Regular verbs add -ed (or -d) for both the past and the past participle.',
		headers: ['Base form', 'Past', 'Past participle'],
		rows: verbs(`
accept, accepted, accepted
add, added, added
agree, agreed, agreed
allow, allowed, allowed
answer, answered, answered
arrive, arrived, arrived
ask, asked, asked
believe, believed, believed
call, called, called
carry, carried, carried
change, changed, changed
clean, cleaned, cleaned
close, closed, closed
cook, cooked, cooked
cry, cried, cried
decide, decided, decided
enjoy, enjoyed, enjoyed
explain, explained, explained
finish, finished, finished
follow, followed, followed
happen, happened, happened
help, helped, helped
hope, hoped, hoped
join, joined, joined
jump, jumped, jumped
laugh, laughed, laughed
learn, learned, learned
like, liked, liked
listen, listened, listened
live, lived, lived
look, looked, looked
love, loved, loved
move, moved, moved
need, needed, needed
open, opened, opened
plan, planned, planned
play, played, played
practise, practised, practised
prepare, prepared, prepared
push, pushed, pushed
rain, rained, rained
remember, remembered, remembered
start, started, started
stay, stayed, stayed
stop, stopped, stopped
study, studied, studied
talk, talked, talked
travel, travelled, travelled
try, tried, tried
use, used, used
visit, visited, visited
wait, waited, waited
walk, walked, walked
want, wanted, wanted
wash, washed, washed
watch, watched, watched
work, worked, worked
worry, worried, worried`)
	},
	{
		key: 'public/resources/irregular-verbs.pdf',
		title: 'Irregular Verbs',
		description: 'Download and memorize the most common irregular verbs for accurate speaking and writing.',
		note: 'Irregular verbs do not follow the -ed rule. Learn all three forms together.',
		headers: ['Base form', 'Past', 'Past participle'],
		rows: verbs(`
be, was / were, been
become, became, become
begin, began, begun
break, broke, broken
bring, brought, brought
build, built, built
buy, bought, bought
catch, caught, caught
choose, chose, chosen
come, came, come
cost, cost, cost
cut, cut, cut
do, did, done
draw, drew, drawn
drink, drank, drunk
drive, drove, driven
eat, ate, eaten
fall, fell, fallen
feel, felt, felt
find, found, found
fly, flew, flown
forget, forgot, forgotten
get, got, got
give, gave, given
go, went, gone
grow, grew, grown
have, had, had
hear, heard, heard
hold, held, held
keep, kept, kept
know, knew, known
leave, left, left
lend, lent, lent
lose, lost, lost
make, made, made
mean, meant, meant
meet, met, met
pay, paid, paid
put, put, put
read, read, read
ride, rode, ridden
ring, rang, rung
rise, rose, risen
run, ran, run
say, said, said
see, saw, seen
sell, sold, sold
send, sent, sent
sing, sang, sung
sit, sat, sat
sleep, slept, slept
speak, spoke, spoken
spend, spent, spent
stand, stood, stood
swim, swam, swum
take, took, taken
teach, taught, taught
tell, told, told
think, thought, thought
understand, understood, understood
wear, wore, worn
win, won, won
write, wrote, written`)
	},
	{
		key: 'public/resources/determiners-at-a-glance.pdf',
		title: 'Determiners at a Glance',
		description: 'Which determiner goes with which noun, on one page: a/an, another, each, every, these, those and more.',
		note: 'A determiner opens a noun phrase. Check what kind of noun it can go with.',
		headers: ['Determiner', 'Goes with', 'Example'],
		rows: verbs(`
a / an, singular countable, a book / an hour
another, singular countable, another cup
each, singular countable, each student
every, singular countable, every day
either, singular countable, either answer
neither, singular countable, neither road
this / that, singular or uncountable, this pen / that water
these / those, plural countable, these books
many, plural countable, many people
a few, plural countable, a few friends
several, plural countable, several times
much, uncountable, much time
a little, uncountable, a little sugar
some, plural or uncountable, some rice / some apples
any, plural or uncountable, any questions
a lot of, plural or uncountable, a lot of money
the, any noun, the sun / the students
my / your / his / her, any noun, my family`)
	}
];
