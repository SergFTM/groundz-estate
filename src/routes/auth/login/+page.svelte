<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let activeTab = $state<'login' | 'register'>('login');
</script>

<svelte:head>
	<title>Login — Develta</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-header">
			<h1 class="auth-title">Welcome</h1>
			<p class="auth-subtitle">Sign in to your Develta account</p>
		</div>

		<div class="auth-tabs">
			<button
				class="auth-tab"
				class:auth-tab--active={activeTab === 'login'}
				onclick={() => (activeTab = 'login')}
				type="button"
			>
				Login
			</button>
			<button
				class="auth-tab"
				class:auth-tab--active={activeTab === 'register'}
				onclick={() => (activeTab = 'register')}
				type="button"
			>
				Register
			</button>
		</div>

		{#if form?.error}
			<div class="auth-alert">{form.error}</div>
		{/if}

		{#if activeTab === 'login'}
			<form method="POST" action="?/login" use:enhance>
				<div class="form-group">
					<label class="form-label" for="login-email">Email</label>
					<input
						class="form-input"
						type="email"
						id="login-email"
						name="email"
						placeholder="you@example.com"
						value={form?.email ?? form?.values?.email ?? ''}
						required
					/>
					{#if form?.errors?.email}
						<p class="form-error">{form.errors.email}</p>
					{/if}
				</div>

				<div class="form-group">
					<label class="form-label" for="login-password">Password</label>
					<input
						class="form-input"
						type="password"
						id="login-password"
						name="password"
						placeholder="Your password"
						required
					/>
					{#if form?.errors?.password}
						<p class="form-error">{form.errors.password}</p>
					{/if}
				</div>

				<button class="btn btn--primary btn--full" type="submit">Sign In</button>
			</form>
		{:else}
			<form method="POST" action="?/register" use:enhance>
				<div class="form-group">
					<label class="form-label" for="reg-name">Full Name</label>
					<input
						class="form-input"
						type="text"
						id="reg-name"
						name="name"
						placeholder="John Doe"
						value={form?.values?.name ?? ''}
						required
					/>
					{#if form?.errors?.name}
						<p class="form-error">{form.errors.name}</p>
					{/if}
				</div>

				<div class="form-group">
					<label class="form-label" for="reg-email">Email</label>
					<input
						class="form-input"
						type="email"
						id="reg-email"
						name="email"
						placeholder="you@example.com"
						value={form?.values?.email ?? ''}
						required
					/>
					{#if form?.errors?.email}
						<p class="form-error">{form.errors.email}</p>
					{/if}
				</div>

				<div class="form-group">
					<label class="form-label" for="reg-password">Password</label>
					<input
						class="form-input"
						type="password"
						id="reg-password"
						name="password"
						placeholder="Min. 6 characters"
						required
					/>
					{#if form?.errors?.password}
						<p class="form-error">{form.errors.password}</p>
					{/if}
				</div>

				<div class="form-group">
					<label class="form-label" for="reg-role">I am a</label>
					<select class="form-input form-select" id="reg-role" name="role" required>
						<option value="buyer" selected={form?.values?.role === 'buyer'}>Buyer</option>
						<option value="investor" selected={form?.values?.role === 'investor'}>Investor</option>
						<option value="agent" selected={form?.values?.role === 'agent'}>Agent</option>
					</select>
					{#if form?.errors?.role}
						<p class="form-error">{form.errors.role}</p>
					{/if}
				</div>

				<button class="btn btn--primary btn--full" type="submit">Create Account</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - var(--header-height, 80px));
		padding: var(--space-8) var(--space-4);
		background: var(--color-bg-alt);
	}

	.auth-card {
		width: 100%;
		max-width: 480px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		padding: var(--space-12) var(--space-10);
	}

	.auth-header {
		text-align: center;
		margin-bottom: var(--space-8);
	}

	.auth-title {
		font-family: var(--font-display);
		font-size: var(--text-4xl);
		color: var(--color-text);
		margin-bottom: var(--space-2);
	}

	.auth-subtitle {
		color: var(--color-text-muted);
		font-size: var(--text-base);
		margin-bottom: 0;
	}

	.auth-tabs {
		display: flex;
		border-bottom: 1px solid var(--color-border);
		margin-bottom: var(--space-8);
	}

	.auth-tab {
		flex: 1;
		padding: var(--space-3) var(--space-4);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: color var(--transition-fast), border-color var(--transition-fast);
	}

	.auth-tab:hover {
		color: var(--color-text);
	}

	.auth-tab--active {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
	}

	.auth-alert {
		background: rgba(239, 68, 68, 0.08);
		color: var(--color-error);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		margin-bottom: var(--space-6);
		border-left: 3px solid var(--color-error);
	}

	.form-select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23555' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		padding-right: 2.5rem;
	}

	@media (max-width: 540px) {
		.auth-card {
			padding: var(--space-8) var(--space-6);
		}

		.auth-title {
			font-size: var(--text-3xl);
		}
	}
</style>
