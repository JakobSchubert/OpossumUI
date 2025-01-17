// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import React from 'react';
import { ClearlyDefinedPackageCard } from '../ClearlyDefinedPackageCard';
import { fireEvent, screen } from '@testing-library/react';
import { getTemporaryPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import { getOpenPopup } from '../../../state/selectors/view-selector';

describe('ClearlyDefinedPackageCard', () => {
  const axiosMock = new MockAdapter(axios);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const testCoordinate = 'sqlalchemy';
  const definitionEndpoint = `https://api.clearlydefined.io/definitions/${testCoordinate}`;

  it('renders after successful fetch', async () => {
    axiosMock.onGet(definitionEndpoint).replyOnce(200, {
      licensed: {
        declared: 'MIT',
        facets: {
          core: {
            attribution: {
              parties: ['Copyright Jane Doe', 'Copyright John Doe'],
            },
          },
        },
      },
      coordinates: {
        type: 'pypi',
        provider: 'pypi',
        name: 'sqlalchemy',
        revision: '1.4.1',
      },
      described: {
        urls: {
          registry: 'https://pypi.org/project/SQLAlchemy',
          version: 'https://pypi.org/project/SQLAlchemy/1.4.1',
        },
      },
    });

    const { store } = renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <ClearlyDefinedPackageCard coordinate={testCoordinate} />
      </QueryClientProvider>
    );

    expect(await screen.findByText('MIT'));
    expect(screen.getByText('https://pypi.org/project/SQLAlchemy/1.4.1'));
    expect(screen.getByText('sqlalchemy - 1.4.1'));

    const expandAccordionButton = screen.getByLabelText('expand accordion');
    fireEvent.click(expandAccordionButton);

    expect(screen.getByText(RegExp('^Copyright Jane Doe')));

    const addPackageInformationButton = screen.getByLabelText('Add');
    fireEvent.click(addPackageInformationButton);

    expect(getTemporaryPackageInfo(store.getState())).toStrictEqual({
      packageName: 'sqlalchemy',
      packageVersion: '1.4.1',
      licenseName: 'MIT',
      packageNamespace: undefined,
      packageType: 'pypi',
      copyright: 'Copyright Jane Doe\nCopyright John Doe',
      url: 'https://pypi.org/project/SQLAlchemy/1.4.1',
    });
    expect(getOpenPopup(store.getState())).toBeNull();
  });
  it('shows error message when fetch fails', async () => {
    // suppress output to console
    jest.spyOn(console, 'error').mockImplementation(() => {});
    axiosMock.onGet(definitionEndpoint).replyOnce(404);

    renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <ClearlyDefinedPackageCard coordinate={testCoordinate} />
      </QueryClientProvider>
    );

    expect(
      await screen.findByText(
        `Failed while fetching data for ${testCoordinate}: Request failed with status code 404`
      )
    );
  });
});
