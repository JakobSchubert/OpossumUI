// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { act, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { Attributions, PackageInfo } from '../../../../shared/shared-types';
import { DiscreteConfidence, View } from '../../../enums/enums';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import { getManualAttributions } from '../../../state/selectors/all-views-resource-selectors';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { AttributionDetailsViewer } from '../AttributionDetailsViewer';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { setSelectedAttributionId } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setTemporaryPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';

describe('The AttributionDetailsViewer', () => {
  it('renders TextBoxes with right titles and content', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      comment: 'some comment',
      packageName: 'Some package',
      packageVersion: '16.5.0',
      copyright: 'Copyright Doe 2019',
      licenseText: 'Permission is hereby granted',
    };
    const { store } = renderComponentWithStore(<AttributionDetailsViewer />);
    act(() => {
      store.dispatch(setSelectedAttributionId('test_id'));
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    });

    expect(screen.queryAllByText('Confidence'));
    expect(
      screen.getByDisplayValue(
        (
          testTemporaryPackageInfo.attributionConfidence as unknown as number
        ).toString()
      )
    );
    expect(screen.queryAllByText('Comment'));
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.comment as string)
    );
    expect(screen.queryAllByText('Name'));
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.packageName as string)
    );
    expect(screen.queryAllByText('Version'));
    expect(
      screen.getByDisplayValue(
        testTemporaryPackageInfo.packageVersion as string
      )
    );
    expect(screen.queryAllByText('Copyright'));
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.copyright as string)
    );
    expect(
      screen.queryAllByText('License Text (to appear in attribution document)')
    );
    expect(
      screen.getByDisplayValue('Permission is hereby granted', { exact: false })
    );
  });

  it('saves temporary info', () => {
    const expectedPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageName: 'React',
    };
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'JQuery',
      },
    };
    const { store } = renderComponentWithStore(<AttributionDetailsViewer />);
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: testManualAttributions,
          })
        )
      );
      store.dispatch(navigateToView(View.Attribution));
      store.dispatch(setSelectedAttributionId('uuid_1'));
      store.dispatch(setTemporaryPackageInfo(expectedPackageInfo));
    });
    expect(screen.getByDisplayValue('React'));

    fireEvent.click(screen.getByRole('button', { name: 'Save' }) as Element);
    expect(getManualAttributions(store.getState()).uuid_1).toEqual(
      expectedPackageInfo
    );
  });
});
