const { getRequestFromUserContext, getUserContext } = require("supertokens-node/recipe/session");
const Session = require("supertokens-node/recipe/session");
const ThirdPartyEmailPassword = require("supertokens-node/recipe/thirdpartyemailpassword");

/**
 * Initiate Google OAuth flow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const googleAuth = async (req, res) => {
    try {
        // Generate Google authorization URL
        const provider = ThirdPartyEmailPassword.Google;
        const authUrl = await ThirdPartyEmailPassword.getAuthorisationURLWithQueryParamsAndSetState({
            provider,
            authorisationURL: `${process.env.API_DOMAIN}/auth/callback/google`,
        });
        
        // Redirect to Google OAuth
        res.redirect(authUrl);
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to initiate Google authentication',
            error: error.message 
        });
    }
};

/**
 * Initiate Twitter OAuth flow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const twitterAuth = async (req, res) => {
    try {
        // Generate Twitter authorization URL
        const provider = ThirdPartyEmailPassword.Twitter;
        const authUrl = await ThirdPartyEmailPassword.getAuthorisationURLWithQueryParamsAndSetState({
            provider,
            authorisationURL: `${process.env.API_DOMAIN}/auth/callback/twitter`,
        });
        
        // Redirect to Twitter OAuth
        res.redirect(authUrl);
    } catch (error) {
        console.error('Twitter auth error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to initiate Twitter authentication',
            error: error.message 
        });
    }
};

/**
 * OAuth callback handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const oauthCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        
        // Get the provider from the URL
        const provider = req.path.split('/').pop(); // 'google' or 'twitter'
        
        // Exchange the authorization code for tokens
        const response = await ThirdPartyEmailPassword.thirdPartySignInUp(provider, code, state);
        
        if (response.status === 'OK') {
            // Create a session
            const session = await Session.createNewSession(
                response.user.id,
                response.user,
                response.session.userDataInJWT
            );
            
            // Set session tokens in cookies
            const tokens = {
                accessToken: session.getAccessToken(),
                refreshToken: session.getRefreshToken(),
                idToken: session.getIdToken(),
                expiresIn: session.getExpiry() - Math.floor(Date.now() / 1000)
            };
            
            // Redirect to frontend with tokens in query params
            const redirectUrl = new URL(process.env.FRONTEND_URL + '/auth/callback');
            Object.entries(tokens).forEach(([key, value]) => {
                redirectUrl.searchParams.append(key, value);
            });
            
            res.redirect(redirectUrl.toString());
        } else {
            throw new Error('Failed to authenticate with the provider');
        }
    } catch (error) {
        console.error('OAuth callback error:', error);
        // Redirect to frontend with error
        const redirectUrl = new URL(process.env.FRONTEND_URL + '/auth/error');
        redirectUrl.searchParams.append('error', error.message);
        res.redirect(redirectUrl.toString());
    }
};

module.exports = {
    googleAuth,
    twitterAuth,
    oauthCallback
};
