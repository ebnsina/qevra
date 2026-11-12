<script lang="ts">
	import {
		ArrowRight02Icon,
		BookOpen01Icon,
		Calendar03Icon,
		CheckmarkCircle02Icon,
		Clock01Icon,
		Download01Icon,
		File01Icon,
		Globe02Icon,
		StarIcon,
		Tag01Icon,
		UserGroupIcon
	} from '@hugeicons/core-free-icons';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import CourseCard from '#lib/components/CourseCard.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import SiteCta from '#lib/components/SiteCta.svelte';
	import { pairs } from '#lib/content.ts';
	import { date } from '#lib/format.ts';

	let { data } = $props();
	const home = $derived(data.home);
	const settings = $derived(data.settings);
	const facts = $derived(pairs(home.facts));
	const points = $derived(pairs(home.points));
	const pointIcons = [Globe02Icon, CheckmarkCircle02Icon, StarIcon, Tag01Icon];
	const factIcons = [Calendar03Icon, UserGroupIcon, BookOpen01Icon, Clock01Icon];

	const steps = [
		{ title: 'Choose a course', text: 'Read what each course covers and watch a free lesson first.' },
		{ title: 'Create your account', text: 'Sign up with your name and email. It takes a minute.' },
		{ title: 'Pay with bKash or Nagad', text: 'Send the fee and enter the transaction ID. We confirm within a day.' },
		{ title: 'Start learning', text: 'Your course opens in your student portal, on phone or computer.' }
	];
</script>

<Seo
	title={settings.tagline ? `${settings.name}: ${settings.tagline}` : settings.name}
	description={settings.description}
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'EducationalOrganization',
		name: settings.name,
		slogan: settings.tagline || undefined,
		description: settings.description,
		email: settings.email || undefined,
		telephone: settings.phone || settings.whatsapp || undefined
	}}
/>

<section class="hero">
	<div class="site-wrap">
		{#if home.badge}
			<a class="pill" href="/courses">
				<Badge tone="accent" dot icon={false}>{home.badge}</Badge>
				<span class="pill-text">{settings.tagline}</span>
				<Icon icon={ArrowRight02Icon} size={16} />
			</a>
		{/if}
		<h1>{home.title}</h1>
		{#if home.lede}<p class="lede">{home.lede}</p>{/if}
		<div class="cta">
			<Button href="/courses" size="lg">{home.cta_label}</Button>
			<Button href="/about" size="lg" variant="outline">About {settings.name}</Button>
		</div>
		{#if facts.length}
			<ul class="facts" aria-label="At a glance">
				{#each facts as fact, i (fact.first)}
					<li><Icon icon={factIcons[i % factIcons.length]} size={18} /><span><strong>{fact.first}</strong> {fact.second}</span></li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

{#if data.partners.length}
	<section class="partners">
		<div class="site-wrap">
			<p class="muted">{home.trusted_title}</p>
			<!-- The row is listed twice so it can slide by without a gap; the copy is hidden from screen readers. -->
			<div class="strip">
				{#each [false, true] as copy (copy)}
					<ul aria-hidden={copy}>
						{#each data.partners as partner (partner.id)}
							<li><img src="/files/{partner.image_key}" alt={copy ? '' : partner.name} title={partner.name} loading="lazy" /></li>
						{/each}
					</ul>
				{/each}
			</div>
		</div>
	</section>
{/if}

<section class="site-section tint" id="courses">
	<div class="site-wrap">
		<div class="site-head row reveal">
			<div>
				<p class="site-eyebrow">Courses</p>
				<h2 class="site-h2">Which English course do you need?</h2>
				<p class="site-lede">Choose the course that meets your exact need and start today.</p>
			</div>
			<Button href="/courses" variant="outline">All courses</Button>
		</div>
		{#if data.courses.length}
			<div class="site-grid">
				{#each data.courses as course (course.slug)}<CourseCard {course} />{/each}
			</div>
		{:else}
			<p class="site-lede">Courses are being prepared. Check back soon.</p>
		{/if}
	</div>
</section>

{#if home.about_title}
	<section class="site-section" id="about">
		<div class="site-wrap about">
			<div class="reveal">
				<p class="site-eyebrow">About us</p>
				<h2 class="site-h2">{home.about_title}</h2>
				<p class="muted about-text">{home.about_text}</p>
				<Button href="/about" variant="outline">Read our story</Button>
			</div>
			{#if home.about_quote}
				<figure class="site-card quote">
					<blockquote>“{home.about_quote}”</blockquote>
					<figcaption><strong>{home.about_name}</strong><span class="muted">{home.about_role}</span></figcaption>
				</figure>
			{/if}
		</div>
	</section>
{/if}

{#if points.length}
	<section class="site-section tint">
		<div class="site-wrap">
			<div class="site-head reveal">
				<p class="site-eyebrow">Why {settings.name}</p>
				<h2 class="site-h2">{home.points_title}</h2>
			</div>
			<ul class="site-grid four">
				{#each points as point, i (point.first)}
					<li class="site-card">
						<div class="card-head">
							<h3 class="site-h3">{point.first}</h3>
							<span class="app-icon"><Icon icon={pointIcons[i % pointIcons.length]} size={20} /></span>
						</div>
						<p class="muted">{point.second}</p>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}

{#if data.reviews.length}
	<section class="site-section">
		<div class="site-wrap">
			<div class="site-head row reveal">
				<div>
					<p class="site-eyebrow">Students' feedback</p>
					<h2 class="site-h2">What do students say?</h2>
				</div>
				<Button href="/reviews" variant="outline">All reviews</Button>
			</div>
			<ul class="site-grid">
				{#each data.reviews as review (review.id)}
					<li class="site-card review">
						<p class="stars" aria-label="5 out of 5">★★★★★</p>
						<blockquote>{review.body}</blockquote>
						<p class="who"><strong>{review.name}</strong><span class="muted">{review.affiliation}</span></p>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}

<section class="site-section tint" id="enroll">
	<div class="site-wrap">
		<div class="site-head reveal">
			<p class="site-eyebrow">Admission</p>
			<h2 class="site-h2">How do I enroll?</h2>
			<p class="site-lede">Four steps, all online.</p>
		</div>
		<ol class="site-grid four">
			{#each steps as step, i (step.title)}
				<li class="site-card">
					<div class="card-head"><h3 class="site-h3">{step.title}</h3><span class="app-icon">{i + 1}</span></div>
					<p class="muted">{step.text}</p>
				</li>
			{/each}
		</ol>
	</div>
</section>

{#if data.resources.length}
	<section class="site-section">
		<div class="site-wrap">
			<div class="site-head row reveal">
				<div>
					<p class="site-eyebrow">Free study resources</p>
					<h2 class="site-h2">Download and keep.</h2>
				</div>
				<Button href="/resources" variant="outline">All resources</Button>
			</div>
			<ul class="site-card rows">
				{#each data.resources as resource (resource.id)}
					<li>
						<span class="app-icon"><Icon icon={File01Icon} size={20} /></span>
						<div>
							<h3 class="site-h3">{resource.title}</h3>
							<p class="muted">{resource.description}</p>
						</div>
						<Button variant="outline" href="/files/{resource.file_key}" download={resource.file_name}>
							<Icon icon={Download01Icon} /> Download
						</Button>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}

{#if data.posts.length}
	<section class="site-section tint">
		<div class="site-wrap">
			<div class="site-head row reveal">
				<div>
					<p class="site-eyebrow">Blog</p>
					<h2 class="site-h2">Read our blog.</h2>
				</div>
				<Button href="/blog" variant="outline">All posts</Button>
			</div>
			<div class="site-grid">
				{#each data.posts as post (post.slug)}
					<a class="site-card post" href="/blog/{post.slug}">
						{#if post.image_key}<img src="/files/{post.image_key}" alt="" loading="lazy" />{/if}
						<div>
							<p class="muted date">{date(post.published_at)}</p>
							<h3 class="site-h3">{post.title}</h3>
							<p class="muted">{post.excerpt}</p>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

<SiteCta title={home.closing_title} text={home.closing_text} />

<style>
	.hero {
		background: radial-gradient(60rem 28rem at 50% -6rem, var(--app-tint-strong), transparent 70%), var(--ui-bg);
		padding-block: clamp(3.5rem, 8vw, 6rem) clamp(3rem, 6vw, 4.5rem);
		text-align: center;
	}
	.pill {
		--ui-radius-control: 999px;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3125rem 0.875rem 0.3125rem 0.3125rem;
		border-radius: 999px;
		background: var(--ui-surface);
		box-shadow: var(--ui-shadow-xs);
		font-size: var(--text-sm);
		text-decoration: none;
	}
	.pill:hover {
		background: var(--ui-hover);
	}
	/* On a phone the tagline would wrap inside the pill; the logo beside it already says it. */
	@media (max-width: 36rem) {
		.pill-text {
			display: none;
		}
	}
	h1 {
		font-size: var(--text-hero);
		line-height: 1.1;
		max-width: 18ch;
		margin: 1.5rem auto 1.25rem;
	}
	.lede {
		max-width: 40rem;
		margin-inline: auto;
		color: var(--ui-muted);
		font-size: clamp(1.0625rem, 2vw, 1.1875rem);
	}
	.cta {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 2rem;
	}
	.facts {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5rem 1.75rem;
		list-style: none;
		padding: 0;
		margin: 2.5rem 0 0;
		color: var(--ui-muted);
		font-size: var(--text-sm);
	}
	.facts li {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	.facts :global(svg) {
		color: var(--ui-accent);
	}
	.facts strong {
		color: var(--ui-fg);
		font-weight: 700;
	}

	.partners {
		padding-block: 0 clamp(3rem, 6vw, 4.5rem);
		text-align: center;
		font-size: var(--text-sm);
	}
	.strip {
		display: flex;
		overflow: hidden;
		margin-top: 1.25rem;
		mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
	}
	.partners ul {
		list-style: none;
		margin: 0;
		padding: 0 1.25rem;
		display: flex;
		flex: none;
		gap: 2.5rem;
		animation: slide 40s linear infinite;
	}
	.strip:hover ul {
		animation-play-state: paused;
	}
	@keyframes slide {
		to {
			transform: translateX(-100%);
		}
	}
	.partners img {
		height: 3rem;
		width: auto;
		/* Logos come on white; a white tile keeps them tidy on the dark theme. */
		padding: 0.25rem;
		border-radius: 0.5rem;
		background: #ffffff;
	}
	/* Without motion the logos sit in a centered, wrapping row and the copy is not shown. */
	@media (prefers-reduced-motion: reduce) {
		.strip {
			mask-image: none;
		}
		.partners ul {
			animation: none;
			flex: 1;
			flex-wrap: wrap;
			justify-content: center;
		}
		.partners ul[aria-hidden='true'] {
			display: none;
		}
	}

	.about {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		align-items: center;
		gap: clamp(2rem, 6vw, 4.5rem);
	}
	@media (max-width: 52rem) {
		.about {
			grid-template-columns: 1fr;
		}
	}
	.about-text {
		margin-bottom: 1.5rem;
		max-width: 36rem;
	}
	.quote {
		margin: 0;
		padding: 2rem;
		background: var(--app-tint);
		box-shadow: none;
	}
	.quote blockquote {
		margin: 0 0 1.5rem;
		font-family: var(--ui-font-heading);
		font-size: var(--text-2xl);
		font-weight: 500;
		letter-spacing: 0.015em;
		line-height: 1.35;
	}
	.quote figcaption,
	.who {
		display: grid;
		font-size: var(--text-sm);
	}

	.review {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.review blockquote {
		margin: 0;
		font-size: var(--text-lg);
		line-height: 1.55;
	}
	.review .who {
		margin-top: auto;
		padding-top: 0.5rem;
	}
	.stars {
		color: var(--ui-accent);
		letter-spacing: 0.15em;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding-block: 0.5rem;
	}
	.rows li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1rem;
		padding-block: 1rem;
	}
	.rows li + li {
		border-top: 1px solid var(--ui-line);
	}
	@media (max-width: 40rem) {
		.rows li {
			grid-template-columns: auto 1fr;
		}
	}

	.post {
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
		text-decoration: none;
	}
	.post img {
		aspect-ratio: 40 / 21;
		width: 100%;
		object-fit: cover;
	}
	.post div {
		display: grid;
		gap: 0.5rem;
		padding: 1.5rem;
	}
	.post .date {
		font-size: var(--text-xs);
	}
	.post:hover h3 {
		color: var(--ui-accent);
	}
</style>
