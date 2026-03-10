<script lang="ts">
	import { enhance } from '$app/forms';
	import { toastStore } from '$lib/stores/platform';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let newsletterSuccess = $state(false);
	let brochureSuccess = $state(false);
	let callBookingSuccess = $state(false);
	let submittingForm = $state<string | null>(null);

	$effect(() => {
		if (form?.success && form?.form === 'newsletter') {
			newsletterSuccess = true;
			submittingForm = null;
			toastStore.success('Successfully subscribed to newsletter!');
		}
		if (form?.success && form?.form === 'brochure') {
			brochureSuccess = true;
			submittingForm = null;
			toastStore.success('Brochure request sent successfully!');
		}
		if (form?.success && form?.form === 'callBooking') {
			callBookingSuccess = true;
			submittingForm = null;
			toastStore.success('Call booking confirmed!');
		}
		if (form?.errors) {
			submittingForm = null;
		}
	});
</script>

<svelte:head>
	<title>Contact — Develta</title>
	<meta name="description" content="Get in touch with Develta. Subscribe to our newsletter, download project brochures, or schedule a call with our investment advisors." />
</svelte:head>

<div class="lead-forms-page">
	<section class="section">
		<div class="container">
			<div class="page-header">
				<h1 class="page-title">Get in Touch</h1>
				<p class="page-subtitle">Connect with our team through any of these channels</p>
			</div>

			<div class="forms-grid">
				<!-- Newsletter -->
				<div class="card form-card">
					<div class="form-card__icon">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<rect x="2" y="4" width="20" height="16" rx="2" />
							<path d="M22 4L12 13L2 4" />
						</svg>
					</div>
					<h3 class="form-card__title">Stay Updated</h3>
					<p class="form-card__desc">Get the latest property insights and market analysis.</p>

					{#if newsletterSuccess}
						<div class="form-success">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="12" r="10" />
								<path d="M8 12L11 15L16 9" />
							</svg>
							<span>Thank you! You're subscribed.</span>
						</div>
					{:else}
						<form
							method="POST"
							action="?/newsletter"
							use:enhance={() => {
								submittingForm = 'newsletter';
								return async ({ update }) => {
									await update();
								};
							}}
						>
							<div class="form-group">
								<label class="form-label" for="nl-email">Email address</label>
								<input
									class="form-input"
									type="email"
									id="nl-email"
									name="email"
									placeholder="you@example.com"
									required
								/>
								{#if form?.form === 'newsletter' && form?.errors?.email}
									<p class="form-error">{form.errors.email}</p>
								{/if}
							</div>

							<div class="form-group">
								<label class="form-checkbox">
									<input type="checkbox" name="gdprConsent" />
									<span>I agree to receive marketing communications</span>
								</label>
								{#if form?.form === 'newsletter' && form?.errors?.gdprConsent}
									<p class="form-error">{form.errors.gdprConsent}</p>
								{/if}
							</div>

							<button
								class="btn btn--primary btn--full"
								type="submit"
								disabled={submittingForm === 'newsletter'}
							>
								{submittingForm === 'newsletter' ? 'Subscribing...' : 'Subscribe'}
							</button>
						</form>
					{/if}
				</div>

				<!-- Brochure -->
				<div class="card form-card">
					<div class="form-card__icon">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
							<polyline points="10 9 9 9 8 9" />
						</svg>
					</div>
					<h3 class="form-card__title">Project Brochure</h3>
					<p class="form-card__desc">Download detailed brochure for your project of interest.</p>

					{#if brochureSuccess}
						<div class="form-success">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="12" r="10" />
								<path d="M8 12L11 15L16 9" />
							</svg>
							<span>Thank you! We'll send the brochure shortly.</span>
						</div>
					{:else}
						<form
							method="POST"
							action="?/brochure"
							use:enhance={() => {
								submittingForm = 'brochure';
								return async ({ update }) => {
									await update();
								};
							}}
						>
							<div class="form-group">
								<label class="form-label" for="br-name">Full name</label>
								<input
									class="form-input"
									type="text"
									id="br-name"
									name="name"
									placeholder="John Doe"
									required
								/>
								{#if form?.form === 'brochure' && form?.errors?.name}
									<p class="form-error">{form.errors.name}</p>
								{/if}
							</div>

							<div class="form-group">
								<label class="form-label" for="br-email">Email</label>
								<input
									class="form-input"
									type="email"
									id="br-email"
									name="email"
									placeholder="you@example.com"
									required
								/>
								{#if form?.form === 'brochure' && form?.errors?.email}
									<p class="form-error">{form.errors.email}</p>
								{/if}
							</div>

							<div class="form-group">
								<label class="form-label" for="br-phone">Phone</label>
								<input
									class="form-input"
									type="tel"
									id="br-phone"
									name="phone"
									placeholder="+357 XX XXX XXX"
									required
								/>
								{#if form?.form === 'brochure' && form?.errors?.phone}
									<p class="form-error">{form.errors.phone}</p>
								{/if}
							</div>

							<div class="form-group">
								<label class="form-label" for="br-project">Project</label>
								<select class="form-input form-select" id="br-project" name="project" required>
									<option value="">Select a project</option>
									{#each data.projects as project}
										<option value={project.id}>{project.name}</option>
									{/each}
								</select>
								{#if form?.form === 'brochure' && form?.errors?.project}
									<p class="form-error">{form.errors.project}</p>
								{/if}
							</div>

							<button
								class="btn btn--primary btn--full"
								type="submit"
								disabled={submittingForm === 'brochure'}
							>
								{submittingForm === 'brochure' ? 'Sending...' : 'Download Brochure'}
							</button>
						</form>
					{/if}
				</div>

				<!-- Call Booking -->
				<div class="card form-card">
					<div class="form-card__icon">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
						</svg>
					</div>
					<h3 class="form-card__title">Schedule a Call</h3>
					<p class="form-card__desc">Speak with our investment advisor at your convenience.</p>

					{#if callBookingSuccess}
						<div class="form-success">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="12" r="10" />
								<path d="M8 12L11 15L16 9" />
							</svg>
							<span>Thank you! We'll call you at your preferred time.</span>
						</div>
					{:else}
						<form
							method="POST"
							action="?/callBooking"
							use:enhance={() => {
								submittingForm = 'callBooking';
								return async ({ update }) => {
									await update();
								};
							}}
						>
							<div class="form-group">
								<label class="form-label" for="cb-name">Full name</label>
								<input
									class="form-input"
									type="text"
									id="cb-name"
									name="name"
									placeholder="John Doe"
									required
								/>
								{#if form?.form === 'callBooking' && form?.errors?.name}
									<p class="form-error">{form.errors.name}</p>
								{/if}
							</div>

							<div class="form-group">
								<label class="form-label" for="cb-phone">Phone</label>
								<input
									class="form-input"
									type="tel"
									id="cb-phone"
									name="phone"
									placeholder="+357 XX XXX XXX"
									required
								/>
								{#if form?.form === 'callBooking' && form?.errors?.phone}
									<p class="form-error">{form.errors.phone}</p>
								{/if}
							</div>

							<div class="form-group">
								<label class="form-label" for="cb-time">Preferred time</label>
								<select class="form-input form-select" id="cb-time" name="timeSlot" required>
									<option value="">Select a time slot</option>
									<option value="morning">Morning (9:00 — 12:00)</option>
									<option value="afternoon">Afternoon (12:00 — 17:00)</option>
									<option value="evening">Evening (17:00 — 20:00)</option>
								</select>
								{#if form?.form === 'callBooking' && form?.errors?.timeSlot}
									<p class="form-error">{form.errors.timeSlot}</p>
								{/if}
							</div>

							<div class="form-group">
								<label class="form-label" for="cb-message">Message (optional)</label>
								<textarea
									class="form-input form-textarea"
									id="cb-message"
									name="message"
									placeholder="Tell us about your investment goals..."
									rows="3"
								></textarea>
							</div>

							<button
								class="btn btn--primary btn--full"
								type="submit"
								disabled={submittingForm === 'callBooking'}
							>
								{submittingForm === 'callBooking' ? 'Booking...' : 'Book a Call'}
							</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.page-header {
		text-align: center;
		margin-bottom: var(--space-16);
	}

	.page-title {
		font-family: var(--font-display);
		font-size: var(--text-5xl);
		color: var(--color-text);
		margin-bottom: var(--space-4);
	}

	.page-subtitle {
		color: var(--color-text-muted);
		font-size: var(--text-lg);
	}

	.forms-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-8);
		align-items: start;
	}

	.form-card {
		display: flex;
		flex-direction: column;
	}

	.form-card__icon {
		color: var(--color-accent);
		margin-bottom: var(--space-4);
	}

	.form-card__title {
		font-family: var(--font-body);
		font-weight: 700;
		font-size: var(--text-xl);
		color: var(--color-text);
		margin-bottom: var(--space-2);
	}

	.form-card__desc {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		margin-bottom: var(--space-6);
	}

	.form-success {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background: rgba(34, 197, 94, 0.08);
		border-left: 3px solid var(--color-success);
		color: var(--color-success);
		font-weight: 600;
		font-size: var(--text-sm);
	}

	@media (max-width: 1024px) {
		.forms-grid {
			grid-template-columns: 1fr;
			max-width: 540px;
			margin: 0 auto;
		}
	}

	@media (max-width: 768px) {
		.page-title {
			font-size: var(--text-3xl);
		}
	}
</style>
