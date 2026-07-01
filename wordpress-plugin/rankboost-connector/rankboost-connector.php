<?php
/**
 * Plugin Name: RankBoost Connector
 * Description: Connects your WordPress site to RankBoost.
 * Version: 0.2.0
 * Author: RankBoost
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: rankboost-connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'RANKBOOST_CONNECTOR_VERSION', '0.2.0' );
define( 'RANKBOOST_CONNECTOR_OPTION_GROUP', 'rankboost_connector_settings' );
define( 'RANKBOOST_CONNECTOR_DEFAULT_API_URL', 'https://rankboost.eu' );

define( 'RANKBOOST_CONNECTOR_STATUS_NOT_CONNECTED', 'not_connected' );
define( 'RANKBOOST_CONNECTOR_STATUS_CONNECTED', 'connected' );
define( 'RANKBOOST_CONNECTOR_STATUS_ERROR', 'error' );

/**
 * Bootstrap plugin hooks.
 */
function rankboost_connector_bootstrap() {
	add_action( 'admin_menu', 'rankboost_connector_register_admin_menu' );
	add_action( 'admin_init', 'rankboost_connector_register_settings' );
	add_action( 'admin_init', 'rankboost_connector_handle_check_connection' );
	add_action( 'rest_api_init', 'rankboost_connector_register_rest_routes' );
}

add_action( 'plugins_loaded', 'rankboost_connector_bootstrap' );

/**
 * Register Settings → RankBoost admin page.
 */
function rankboost_connector_register_admin_menu() {
	add_options_page(
		'RankBoost Connector',
		'RankBoost',
		'manage_options',
		'rankboost-connector',
		'rankboost_connector_render_settings_page'
	);
}

/**
 * Register plugin options with the Settings API.
 */
function rankboost_connector_register_settings() {
	register_setting(
		RANKBOOST_CONNECTOR_OPTION_GROUP,
		'rankboost_api_url',
		array(
			'type'              => 'string',
			'sanitize_callback' => 'rankboost_connector_sanitize_api_url',
			'default'           => RANKBOOST_CONNECTOR_DEFAULT_API_URL,
		)
	);

	register_setting(
		RANKBOOST_CONNECTOR_OPTION_GROUP,
		'rankboost_api_key',
		array(
			'type'              => 'string',
			'sanitize_callback' => 'rankboost_connector_sanitize_api_key',
			'default'           => '',
		)
	);

	register_setting(
		RANKBOOST_CONNECTOR_OPTION_GROUP,
		'rankboost_api_secret',
		array(
			'type'              => 'string',
			'sanitize_callback' => 'rankboost_connector_sanitize_api_secret',
			'default'           => '',
		)
	);

	register_setting(
		RANKBOOST_CONNECTOR_OPTION_GROUP,
		'rankboost_connection_status',
		array(
			'type'              => 'string',
			'sanitize_callback' => 'rankboost_connector_sanitize_connection_status',
			'default'           => RANKBOOST_CONNECTOR_STATUS_NOT_CONNECTED,
		)
	);

	register_setting(
		RANKBOOST_CONNECTOR_OPTION_GROUP,
		'rankboost_last_ping_at',
		array(
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
		)
	);
}

/**
 * Sanitize RankBoost API base URL.
 *
 * @param string $value Raw input.
 * @return string
 */
function rankboost_connector_sanitize_api_url( $value ) {
	$value = trim( (string) $value );

	if ( $value === '' ) {
		return RANKBOOST_CONNECTOR_DEFAULT_API_URL;
	}

	$sanitized = esc_url_raw( $value );

	if ( $sanitized === '' ) {
		add_settings_error(
			'rankboost_api_url',
			'rankboost_invalid_api_url',
			'Invalid RankBoost API URL.',
			'error'
		);
		return RANKBOOST_CONNECTOR_DEFAULT_API_URL;
	}

	return untrailingslashit( $sanitized );
}

/**
 * Sanitize API key; keep existing key when field left blank.
 *
 * @param string $value Raw input.
 * @return string
 */
function rankboost_connector_sanitize_api_key( $value ) {
	$value = sanitize_text_field( (string) $value );
	$existing = (string) get_option( 'rankboost_api_key', '' );

	if ( $value === '' ) {
		return $existing;
	}

	$masked = rankboost_connector_mask_api_key( $existing );
	if ( $existing !== '' && $value === $masked ) {
		return $existing;
	}

	return $value;
}

/**
 * Sanitize shared secret; keep existing secret when field left blank.
 *
 * @param string $value Raw input.
 * @return string
 */
function rankboost_connector_sanitize_api_secret( $value ) {
	$value = sanitize_text_field( (string) $value );
	$existing = (string) get_option( 'rankboost_api_secret', '' );

	if ( $value === '' ) {
		return $existing;
	}

	$masked = rankboost_connector_mask_secret( $existing );
	if ( $existing !== '' && $value === $masked ) {
		return $existing;
	}

	return $value;
}

/**
 * Sanitize stored connection status.
 *
 * @param string $value Raw input.
 * @return string
 */
function rankboost_connector_sanitize_connection_status( $value ) {
	$allowed = array(
		RANKBOOST_CONNECTOR_STATUS_NOT_CONNECTED,
		RANKBOOST_CONNECTOR_STATUS_CONNECTED,
		RANKBOOST_CONNECTOR_STATUS_ERROR,
	);

	$value = sanitize_text_field( (string) $value );

	if ( in_array( $value, $allowed, true ) ) {
		return $value;
	}

	return RANKBOOST_CONNECTOR_STATUS_NOT_CONNECTED;
}

/**
 * Mask API key for display (never show full key in admin UI).
 *
 * @param string $api_key Stored API key.
 * @return string
 */
function rankboost_connector_mask_api_key( $api_key ) {
	$api_key = (string) $api_key;

	if ( $api_key === '' ) {
		return '';
	}

	$length = strlen( $api_key );

	if ( $length <= 8 ) {
		return str_repeat( '*', $length );
	}

	return substr( $api_key, 0, 6 ) . str_repeat( '*', max( 4, $length - 10 ) ) . substr( $api_key, -4 );
}

/**
 * Mask shared secret for display.
 *
 * @param string $secret Stored shared secret.
 * @return string
 */
function rankboost_connector_mask_secret( $secret ) {
	return rankboost_connector_mask_api_key( $secret );
}

/**
 * Human-readable connection status label.
 *
 * @param string $status Stored status slug.
 * @return string
 */
function rankboost_connector_status_label( $status ) {
	switch ( $status ) {
		case RANKBOOST_CONNECTOR_STATUS_CONNECTED:
			return 'Connected';
		case RANKBOOST_CONNECTOR_STATUS_ERROR:
			return 'Error';
		default:
			return 'Not connected';
	}
}

/**
 * CSS class for connection status badge.
 *
 * @param string $status Stored status slug.
 * @return string
 */
function rankboost_connector_status_class( $status ) {
	switch ( $status ) {
		case RANKBOOST_CONNECTOR_STATUS_CONNECTED:
			return 'rankboost-status rankboost-status--connected';
		case RANKBOOST_CONNECTOR_STATUS_ERROR:
			return 'rankboost-status rankboost-status--error';
		default:
			return 'rankboost-status rankboost-status--disconnected';
	}
}

/**
 * Handle "Check connection" POST from admin page.
 */
function rankboost_connector_handle_check_connection() {
	if ( ! isset( $_POST['rankboost_check_connection'] ) ) {
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to access this page.', 'rankboost-connector' ) );
	}

	check_admin_referer( 'rankboost_check_connection', 'rankboost_check_connection_nonce' );

	$api_url = rankboost_connector_sanitize_api_url( (string) get_option( 'rankboost_api_url', RANKBOOST_CONNECTOR_DEFAULT_API_URL ) );
	$api_key = (string) get_option( 'rankboost_api_key', '' );

	if ( $api_key === '' ) {
		rankboost_connector_set_connection_status( RANKBOOST_CONNECTOR_STATUS_ERROR );
		rankboost_connector_add_admin_notice( 'error', 'Save an API key before checking the connection.' );
		rankboost_connector_redirect_to_settings();
	}

	$result = rankboost_connector_ping( $api_url, $api_key );

	if ( $result['success'] ) {
		update_option( 'rankboost_connection_status', RANKBOOST_CONNECTOR_STATUS_CONNECTED );
		update_option( 'rankboost_last_ping_at', current_time( 'mysql' ) );
		rankboost_connector_add_admin_notice( 'success', 'Connection successful. RankBoost is linked to this site.' );
	} else {
		update_option( 'rankboost_connection_status', RANKBOOST_CONNECTOR_STATUS_ERROR );
		rankboost_connector_add_admin_notice( 'error', $result['message'] );
	}

	rankboost_connector_redirect_to_settings();
}

/**
 * Persist connection status helper.
 *
 * @param string $status Status slug.
 */
function rankboost_connector_set_connection_status( $status ) {
	update_option( 'rankboost_connection_status', rankboost_connector_sanitize_connection_status( $status ) );
}

/**
 * Store admin notice in transient for redirect flow.
 *
 * @param string $type Notice type: success|error|warning|info.
 * @param string $message Notice message.
 */
function rankboost_connector_add_admin_notice( $type, $message ) {
	set_transient(
		'rankboost_connector_admin_notice',
		array(
			'type'    => $type,
			'message' => $message,
		),
		30
	);
}

/**
 * Redirect back to plugin settings page.
 */
function rankboost_connector_redirect_to_settings() {
	wp_safe_redirect(
		add_query_arg(
			array(
				'page' => 'rankboost-connector',
			),
			admin_url( 'options-general.php' )
		)
	);
	exit;
}

/**
 * Ping RankBoost /api/wordpress/ping endpoint.
 *
 * @param string $api_url RankBoost API base URL.
 * @param string $api_key Plugin API key.
 * @return array{success:bool,message:string,permissions?:array}
 */
function rankboost_connector_ping( $api_url, $api_key ) {
	$endpoint = untrailingslashit( $api_url ) . '/api/wordpress/ping';

	$response = wp_remote_post(
		$endpoint,
		array(
			'timeout' => 15,
			'headers' => array(
				'Content-Type'    => 'application/json',
				'X-RankBoost-Key' => $api_key,
			),
			'body'    => wp_json_encode(
				array(
					'siteUrl'       => home_url(),
					'pluginVersion' => RANKBOOST_CONNECTOR_VERSION,
				)
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		return array(
			'success' => false,
			'message' => 'Connection failed: ' . $response->get_error_message(),
		);
	}

	$status_code = (int) wp_remote_retrieve_response_code( $response );
	$body        = wp_remote_retrieve_body( $response );
	$data        = json_decode( $body, true );

	if ( $status_code === 401 ) {
		return array(
			'success' => false,
			'message' => 'Invalid API key. Create a new key in RankBoost and try again.',
		);
	}

	if ( $status_code < 200 || $status_code >= 300 ) {
		$error_message = 'RankBoost returned HTTP ' . $status_code . '.';

		if ( is_array( $data ) && ! empty( $data['error']['message'] ) ) {
			$error_message = sanitize_text_field( (string) $data['error']['message'] );
		}

		return array(
			'success' => false,
			'message' => $error_message,
		);
	}

	if ( ! is_array( $data ) || empty( $data['success'] ) ) {
		return array(
			'success' => false,
			'message' => 'Unexpected response from RankBoost.',
		);
	}

	return array(
		'success'     => true,
		'message'     => 'Connected.',
		'permissions' => isset( $data['permissions'] ) && is_array( $data['permissions'] ) ? $data['permissions'] : array(),
	);
}

/**
 * Register RankBoost REST routes.
 */
function rankboost_connector_register_rest_routes() {
	register_rest_route(
		'rankboost/v1',
		'/drafts',
		array(
			'methods'             => 'POST',
			'callback'            => 'rankboost_connector_create_draft',
			'permission_callback' => '__return_true',
		)
	);
}

/**
 * Verify shared secret and connection status for draft creation.
 *
 * @param WP_REST_Request $request Incoming request.
 * @return true|WP_Error
 */
function rankboost_connector_verify_draft_request( WP_REST_Request $request ) {
	$secret = sanitize_text_field( (string) $request->get_header( 'X-RankBoost-Secret' ) );

	if ( $secret === '' ) {
		return new WP_Error(
			'rankboost_unauthorized',
			'Missing shared secret.',
			array( 'status' => 401 )
		);
	}

	$stored_secret = (string) get_option( 'rankboost_api_secret', '' );

	if ( $stored_secret === '' || ! hash_equals( $stored_secret, $secret ) ) {
		return new WP_Error(
			'rankboost_unauthorized',
			'Invalid shared secret.',
			array( 'status' => 401 )
		);
	}

	$connection_status = (string) get_option(
		'rankboost_connection_status',
		RANKBOOST_CONNECTOR_STATUS_NOT_CONNECTED
	);

	if ( $connection_status !== RANKBOOST_CONNECTOR_STATUS_CONNECTED ) {
		return new WP_Error(
			'rankboost_not_connected',
			'RankBoost connection is not active.',
			array( 'status' => 403 )
		);
	}

	return true;
}

/**
 * Create a draft post from RankBoost payload.
 *
 * @param WP_REST_Request $request Incoming request.
 * @return WP_REST_Response|WP_Error
 */
function rankboost_connector_create_draft( WP_REST_Request $request ) {
	$auth = rankboost_connector_verify_draft_request( $request );
	if ( is_wp_error( $auth ) ) {
		return $auth;
	}

	$params = $request->get_json_params();
	if ( ! is_array( $params ) ) {
		return new WP_Error(
			'rankboost_invalid_body',
			'Invalid JSON body.',
			array( 'status' => 400 )
		);
	}

	$title = isset( $params['title'] ) ? sanitize_text_field( (string) $params['title'] ) : '';
	if ( $title === '' ) {
		return new WP_Error(
			'rankboost_invalid_title',
			'Title is required.',
			array( 'status' => 400 )
		);
	}

	$content_html = isset( $params['contentHtml'] ) ? wp_kses_post( (string) $params['contentHtml'] ) : '';
	$slug = isset( $params['slug'] ) ? sanitize_title( (string) $params['slug'] ) : '';
	$meta_title = isset( $params['metaTitle'] ) ? sanitize_text_field( (string) $params['metaTitle'] ) : '';
	$meta_description = isset( $params['metaDescription'] ) ? sanitize_text_field( (string) $params['metaDescription'] ) : '';
	$language = isset( $params['language'] ) ? sanitize_text_field( (string) $params['language'] ) : '';

	$post_data = array(
		'post_type'    => 'post',
		'post_status'  => 'draft',
		'post_title'   => $title,
		'post_content' => $content_html,
	);

	if ( $slug !== '' ) {
		$post_data['post_name'] = $slug;
	}

	$post_id = wp_insert_post( wp_slash( $post_data ), true );

	if ( is_wp_error( $post_id ) ) {
		return $post_id;
	}

	update_post_meta( $post_id, '_rankboost_meta_title', $meta_title );
	update_post_meta( $post_id, '_rankboost_meta_description', $meta_description );
	update_post_meta( $post_id, '_rankboost_language', $language );

	$edit_url = get_edit_post_link( $post_id, 'raw' );
	if ( ! is_string( $edit_url ) || $edit_url === '' ) {
		$edit_url = admin_url( 'post.php?action=edit&post=' . $post_id );
	}

	return rest_ensure_response(
		array(
			'success' => true,
			'postId'  => (int) $post_id,
			'editUrl' => esc_url_raw( $edit_url ),
		)
	);
}

/**
 * Render Settings → RankBoost admin page.
 */
function rankboost_connector_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$notice = get_transient( 'rankboost_connector_admin_notice' );
	if ( is_array( $notice ) ) {
		delete_transient( 'rankboost_connector_admin_notice' );
	}

	$api_url            = (string) get_option( 'rankboost_api_url', RANKBOOST_CONNECTOR_DEFAULT_API_URL );
	$stored_api_key     = (string) get_option( 'rankboost_api_key', '' );
	$masked_api_key     = rankboost_connector_mask_api_key( $stored_api_key );
	$stored_api_secret  = (string) get_option( 'rankboost_api_secret', '' );
	$masked_api_secret  = rankboost_connector_mask_secret( $stored_api_secret );
	$connection_status  = (string) get_option( 'rankboost_connection_status', RANKBOOST_CONNECTOR_STATUS_NOT_CONNECTED );
	$last_ping_at       = (string) get_option( 'rankboost_last_ping_at', '' );
	$status_label       = rankboost_connector_status_label( $connection_status );
	$status_class       = rankboost_connector_status_class( $connection_status );

	?>
	<div class="wrap rankboost-connector-wrap">
		<h1><?php echo esc_html( 'RankBoost Connector' ); ?></h1>

		<p class="description">
			<?php echo esc_html( 'Connect this WordPress site to RankBoost to create SEO drafts and future autopilot improvements.' ); ?>
		</p>

		<?php if ( is_array( $notice ) && ! empty( $notice['message'] ) ) : ?>
			<div class="notice notice-<?php echo esc_attr( $notice['type'] ); ?> is-dismissible">
				<p><?php echo esc_html( $notice['message'] ); ?></p>
			</div>
		<?php endif; ?>

		<?php settings_errors(); ?>

		<div class="<?php echo esc_attr( $status_class ); ?>">
			<strong><?php echo esc_html( 'Status:' ); ?></strong>
			<span><?php echo esc_html( $status_label ); ?></span>
			<?php if ( $last_ping_at !== '' ) : ?>
				<span class="rankboost-last-ping">
					<?php
					echo esc_html(
						sprintf(
							'Last ping: %s',
							$last_ping_at
						)
					);
					?>
				</span>
			<?php endif; ?>
		</div>

		<form method="post" action="options.php" class="rankboost-settings-form">
			<?php
			settings_fields( RANKBOOST_CONNECTOR_OPTION_GROUP );
			do_settings_sections( RANKBOOST_CONNECTOR_OPTION_GROUP );
			?>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">
						<label for="rankboost_api_url"><?php echo esc_html( 'RankBoost API URL' ); ?></label>
					</th>
					<td>
						<input
							type="url"
							id="rankboost_api_url"
							name="rankboost_api_url"
							value="<?php echo esc_attr( $api_url ); ?>"
							class="regular-text"
							placeholder="<?php echo esc_attr( RANKBOOST_CONNECTOR_DEFAULT_API_URL ); ?>"
						/>
						<p class="description">
							<?php echo esc_html( 'Base URL of your RankBoost instance (default: https://rankboost.eu).' ); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="rankboost_api_key"><?php echo esc_html( 'API key' ); ?></label>
					</th>
					<td>
						<?php if ( $stored_api_key !== '' ) : ?>
							<p class="rankboost-masked-key">
								<?php echo esc_html( 'Stored key: ' . $masked_api_key ); ?>
							</p>
						<?php endif; ?>
						<input
							type="password"
							id="rankboost_api_key"
							name="rankboost_api_key"
							value=""
							class="regular-text"
							autocomplete="off"
							placeholder="<?php echo esc_attr( $stored_api_key !== '' ? 'Enter a new key to replace the stored key' : 'Paste your RankBoost API key' ); ?>"
						/>
						<p class="description">
							<?php
							echo esc_html(
								$stored_api_key !== ''
									? 'Used for Check connection (ping). Leave blank to keep the current key.'
									: 'Paste the API Key from RankBoost Integrations → WordPress.'
							);
							?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="rankboost_api_secret"><?php echo esc_html( 'Shared Secret' ); ?></label>
					</th>
					<td>
						<?php if ( $stored_api_secret !== '' ) : ?>
							<p class="rankboost-masked-key">
								<?php echo esc_html( 'Stored secret: ' . $masked_api_secret ); ?>
							</p>
						<?php endif; ?>
						<input
							type="password"
							id="rankboost_api_secret"
							name="rankboost_api_secret"
							value=""
							class="regular-text"
							autocomplete="off"
							placeholder="<?php echo esc_attr( $stored_api_secret !== '' ? 'Enter a new secret to replace the stored secret' : 'Paste your RankBoost Shared Secret' ); ?>"
						/>
						<p class="description">
							<?php
							echo esc_html(
								$stored_api_secret !== ''
									? 'Used for draft creation from RankBoost. Leave blank to keep the current secret.'
									: 'Paste the Shared Secret from RankBoost Integrations → WordPress.'
							);
							?>
						</p>
					</td>
				</tr>
			</table>

			<?php submit_button( 'Save settings' ); ?>
		</form>

		<form method="post" action="" class="rankboost-check-form">
			<?php wp_nonce_field( 'rankboost_check_connection', 'rankboost_check_connection_nonce' ); ?>
			<input type="hidden" name="rankboost_check_connection" value="1" />
			<?php submit_button( 'Check connection', 'secondary', 'submit', false ); ?>
		</form>

		<style>
			.rankboost-connector-wrap .rankboost-status {
				display: inline-flex;
				flex-wrap: wrap;
				align-items: center;
				gap: 8px;
				margin: 16px 0 24px;
				padding: 10px 14px;
				border-radius: 6px;
				border: 1px solid #ccd0d4;
				background: #fff;
			}

			.rankboost-status--connected {
				border-color: #46b450;
				background: #ecf7ed;
			}

			.rankboost-status--error {
				border-color: #dc3232;
				background: #fceeee;
			}

			.rankboost-status--disconnected {
				border-color: #ccd0d4;
				background: #f6f7f7;
			}

			.rankboost-last-ping {
				color: #646970;
				font-size: 12px;
			}

			.rankboost-masked-key {
				font-family: monospace;
				margin-bottom: 8px;
			}

			.rankboost-check-form {
				margin-top: 8px;
			}
		</style>
	</div>
	<?php
}
