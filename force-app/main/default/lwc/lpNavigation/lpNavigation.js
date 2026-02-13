/**
 * lpNavigation
 * Main navigation container for FundPanel LP Portal
 * Provides left sidebar navigation with routing between different sections
 * Implements collapse/expand functionality and profile dropdown
 */

import { LightningElement, track } from 'lwc';
import PORTAL_ICONS from '@salesforce/resourceUrl/PortalIcons';
import FUNDPANEL_LOGO from '@salesforce/resourceUrl/fundpanel_logo_square';

export default class LpNavigation extends LightningElement {
    @track currentView = 'overview';
    @track isCollapsed = false;
    @track isProfileDropdownOpen = false;

    // Static resource base URL for icons
    portalIconsBase = PORTAL_ICONS;

    // Icon mapping for menu items
    iconMap = {
        'overview': 'trending_up.svg',
        'documents': 'text_snippet.svg',
        'funds': 'paid.svg',
        'capital-commitments': 'Icon.svg',
        'capital-calls': 'Icon-1.svg',
        'distributions': 'Icon-2.svg',
        'capital-accounts': 'Icon-3.svg',
        'investment-vehicle': 'Icon-4.svg',
        'data-room': 'Icon-5.svg',
        'help': 'Icon-6.svg',
        'support': 'Group.svg',
        'account': 'Icon.svg',
        'password': 'Icon-1.svg',
        'mfa': 'Icon-2.svg',
        'logout': 'Icon-3.svg'
    };

    // Navigation menu items
    menuItems = [
        { id: 'overview', label: 'Overview', icon: 'trending_up.svg', active: true },
        { id: 'documents', label: 'Documents', icon: 'text_snippet.svg', active: false },
        { id: 'funds', label: 'Funds', icon: 'paid.svg', active: false },
        { id: 'capital-commitments', label: 'Capital Commitments', icon: 'Icon.svg', active: false },
        { id: 'capital-calls', label: 'Capital Calls', icon: 'Icon-1.svg', active: false },
        { id: 'distributions', label: 'Distributions', icon: 'Icon-2.svg', active: false },
        { id: 'capital-accounts', label: 'Capital Accounts', icon: 'Icon-3.svg', active: false },
        { id: 'investment-vehicle', label: 'Investment Vehicle', icon: 'Icon-4.svg', active: false },
        { id: 'data-room', label: 'Aduro Capital Data Room', icon: 'Icon-5.svg', active: false }
    ];

    helpItems = [
        { id: 'help', label: 'Help', icon: 'Icon-6.svg' },
        { id: 'support', label: 'Get Support', icon: 'Group.svg' }
    ];

    // Profile dropdown menu items
    profileItems = [
        { id: 'account', label: 'Account', icon: 'Icon.svg', hasDivider: false },
        { id: 'password', label: 'Change Password', icon: 'Icon-1.svg', hasDivider: false },
        { id: 'mfa', label: 'Setup SMS MFA', icon: 'Icon-2.svg', hasDivider: true },
        { id: 'logout', label: 'Log out', icon: 'Icon-3.svg', hasDivider: false }
    ];

    // User data (would come from Apex in production)
    userName = 'User';
    userInitial = 'A';

    /**
     * Lifecycle: Connected callback
     */
    connectedCallback() {
        // Add click listener to close dropdown when clicking outside
        this._handleOutsideClick = this.handleOutsideClick.bind(this);
        document.addEventListener('click', this._handleOutsideClick);
    }

    /**
     * Lifecycle: Disconnected callback
     */
    disconnectedCallback() {
        if (this._handleOutsideClick) {
            document.removeEventListener('click', this._handleOutsideClick);
        }
    }

    /**
     * Handle clicks outside the profile dropdown to close it
     */
    handleOutsideClick(event) {
        if (this.isProfileDropdownOpen) {
            const profileSection = this.template.querySelector('.profile-section');
            if (profileSection && !profileSection.contains(event.target)) {
                this.isProfileDropdownOpen = false;
            }
        }
    }

    /**
     * Get logo URL
     */
    get logoUrl() {
        return FUNDPANEL_LOGO;
    }

    /**
     * Get collapse icon URL
     */
    get collapseIconUrl() {
        return `${this.portalIconsBase}/left_panel_close.svg`;
    }

    /**
     * Get account icon URL for dropdown
     */
    get accountIconUrl() {
        return `${this.portalIconsBase}/Icon.svg`;
    }

    /**
     * Get password icon URL for dropdown
     */
    get passwordIconUrl() {
        return `${this.portalIconsBase}/Icon-1.svg`;
    }

    /**
     * Get MFA icon URL for dropdown
     */
    get mfaIconUrl() {
        return `${this.portalIconsBase}/Icon-2.svg`;
    }

    /**
     * Get logout icon URL for dropdown
     */
    get logoutIconUrl() {
        return `${this.portalIconsBase}/Icon-3.svg`;
    }

    /**
     * Get collapse toggle button title
     */
    get collapseToggleTitle() {
        return this.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
    }

    /**
     * Get sidebar CSS class based on collapsed state
     */
    get sidebarClass() {
        return this.isCollapsed ? 'sidebar collapsed' : 'sidebar';
    }

    /**
     * Get portal container CSS class
     */
    get portalContainerClass() {
        return this.isCollapsed ? 'portal-container sidebar-collapsed' : 'portal-container';
    }

    /**
     * Get profile dropdown CSS class
     */
    get profileDropdownClass() {
        return this.isProfileDropdownOpen ? 'profile-dropdown open' : 'profile-dropdown';
    }

    /**
     * Get current active menu items with active state and icon URLs
     */
    get activeMenuItems() {
        return this.menuItems.map(item => ({
            ...item,
            active: item.id === this.currentView,
            class: item.id === this.currentView ? 'nav-item active' : 'nav-item',
            iconUrl: `${this.portalIconsBase}/${item.icon}`
        }));
    }

    /**
     * Get help menu items with icon URLs
     */
    get activeHelpItems() {
        return this.helpItems.map(item => ({
            ...item,
            class: 'nav-item',
            iconUrl: `${this.portalIconsBase}/${item.icon}`
        }));
    }

    /**
     * Get profile menu items with icon URLs
     */
    get profileMenuItems() {
        return this.profileItems.map(item => ({
            ...item,
            iconUrl: `${this.portalIconsBase}/${item.icon}`
        }));
    }

    /**
     * Check if current view is overview
     */
    get isOverviewView() {
        return this.currentView === 'overview';
    }

    /**
     * Check if current view is in progress (not overview)
     */
    get isInProgressView() {
        return this.currentView !== 'overview';
    }

    /**
     * Get the label of current view for in-progress page
     */
    get currentViewLabel() {
        const item = [...this.menuItems, ...this.helpItems].find(i => i.id === this.currentView);
        return item ? item.label : 'Page';
    }

    /**
     * Handle navigation item click
     */
    handleNavItemClick(event) {
        const viewId = event.currentTarget.dataset.viewId;
        this.currentView = viewId;
        // Close profile dropdown if open
        this.isProfileDropdownOpen = false;
    }

    /**
     * Handle collapse toggle click
     */
    handleCollapseToggle() {
        this.isCollapsed = !this.isCollapsed;
        // Close profile dropdown when collapsing
        if (this.isCollapsed) {
            this.isProfileDropdownOpen = false;
        }
    }

    /**
     * Handle profile trigger click
     */
    handleProfileClick(event) {
        event.stopPropagation();
        this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    }

    /**
     * Handle profile dropdown action click
     */
    handleProfileAction(event) {
        const action = event.currentTarget.dataset.action;

        // Close dropdown
        this.isProfileDropdownOpen = false;

        // Handle actions (dummy actions for now)
        switch (action) {
            case 'account':
                console.log('Account action triggered');
                // Would navigate to account page in production
                break;
            case 'password':
                console.log('Change Password action triggered');
                // Would navigate to change password page in production
                break;
            case 'mfa':
                console.log('Setup SMS MFA action triggered');
                // Would navigate to MFA setup page in production
                break;
            case 'logout':
                console.log('Logout action triggered');
                // Would trigger logout in production
                break;
            default:
                console.log(`Unknown action: ${action}`);
        }
    }

    /**
     * Error callback for handling component errors
     */
    errorCallback(error, stack) {
        console.error('lpNavigation error:', error);
        console.error('Stack:', stack);
    }
}
