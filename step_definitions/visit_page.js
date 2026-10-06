/**
 * @module VisitPage
 * @author Adam De Fouw <aldefouw@medicine.wisc.edu>
 * @description Instructs Cypress to the REDCap login page
 */
Given("I visit the REDCap login page", () => {
    cy.logout()
    cy.visit_version({page: '/'})
})

/**
 * @module VisitPage
 * @param {string} label - the visible label of the link
 * @param {string} name - the name used to retrieve the saved URL
 * @description Saves a visible link's destination for later navigation in the same scenario.
 */
Given("I save the URL linked by {string} as {string}", (label, name) => {
    cy.getLabeledElement('link', label).then(($link) => {
        const href = $link.prop('href')

        expect(href, `URL linked by ${label}`).to.be.a('string').and.not.be.empty
        cy.wrap(href).as(name)
    })
})

/**
 * @module VisitPage
 * @param {string} name - the name used when the URL was saved
 * @description Visits a URL saved earlier in the same scenario.
 */
Given("I visit the saved URL {string}", (name) => {
    cy.get(`@${name}`).then((href) => {
        cy.visit(href)
    })
})

/**
 * @module VisitPage
 * @author Mark McEver <mark.mcever@vumc.org>
 * @description Executes REDCap's crons and returns to the previous page
 */
Given("I wait for background processes to finish", () => {
    cy
        // Simulate the crons running a minute ago so that another cron can run immediately if desired
        .mysql_query(`
                update redcap_crons c
                join redcap_crons_history h
                    on h.cron_id = c.cron_id
                set
                    c.cron_last_run_start = date_add(cron_last_run_start, interval -1 minute),
                    c.cron_last_run_end = date_add(cron_last_run_end, interval -1 minute),
                    h.cron_run_start = date_add(cron_run_start, interval -1 minute),
                    h.cron_run_end = date_add(cron_run_end, interval -1 minute)
        `)
        .visit('/cron.php')
        .get('body')
        .contains('Cron Run Report')
        .document().then(oldDoc => {
            cy.go('back')

            cy.document().should(newDoc => {
                /**
                 * If we're calling this step multiple times in a row (e.g. B.3.16.1400.),
                 * we must make sure we return to the old page before the next call starts.
                 */
                expect(newDoc).not.to.eq(oldDoc)
            })
        })
})
