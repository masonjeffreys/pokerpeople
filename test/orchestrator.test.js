'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation

const Table = require('../src/table');
const Orchestrator = require('../src/orchestrator');
const table = Table(1);

describe('nextStreet',()=>{
    it('will advance street on table', () => {
        table.street = 'preflop';
        expect(Orchestrator.nextStreet(table.street)).to.equal('flop')
    })
})