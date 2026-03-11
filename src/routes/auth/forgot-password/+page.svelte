<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head>
	<title>Forgot Password — Develta</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-header">
			<h1 class="auth-title">Reset Password</h1>
			<p class="auth-subtitle">Enter your email to receive a reset link</p>
		</div>

		{#if form?.success}
			<div class="auth-success">
				If an account with that email exists, we've sent a password reset link. Check your console in development.
			</div>
			<a href="/auth/login" class="btn btn--primary btn--full" style="text-align:center;display:block;text-decoration:none;">Back to Login</a>
		{:else}
			{#if form?.error}
				<div class="auth-alert">{form.error}</div>
			{/if}

			<form method="POST" use:enhance>
				<div class="form-group">
					<label class="form-label" for="email">Email</label>
					<input
						class="form-input"
						type="email"
						id="email"
						name="email"
						placeholder="you@example.com"
						required
					/>
				</div>

				<button class="btn btn--primary btn--full" type="submit">Send Reset Link</button>
			</form>

			<div style="text-align:center;margin-top:var(--space-6);">
				<a href="/auth/login" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;">Back to Login</a>
			</div>
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

	.auth-alert {
		background: rgba(239, 68, 68, 0.08);
		color: var(--color-error);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		margin-bottom: var(--space-6);
		border-left: 3px solid var(--color-error);
	}

	.auth-success {
		background: rgba(34, 197, 94, 0.08);
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		font-size: var(--text-sm);
		color: #22c55e;
		margin-bottom: var(--space-6);
		line-height: 1.5;
	}
</style>
