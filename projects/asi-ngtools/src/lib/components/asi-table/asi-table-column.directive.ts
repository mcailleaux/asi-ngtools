import { AsiTableInliner } from './asi-table-inliner.directive';
import { Directive, Input, ContentChild, EventEmitter, Output, AfterContentInit, ContentChildren, QueryList, OnInit } from '@angular/core';
import { AsiComponentTemplateTableHeaderDef, AsiComponentTemplateCellDef } from '../common/asi-component-template';

@Directive({
  /* tslint:disable-next-line:directive-selector */
  selector: 'asi-table-column',
})
export class AsiTableColumn implements AfterContentInit, OnInit {

  /** Column name (used to extract data from bean if cell template not defined) */
  @Input() name: string;
  /** name of the bean attribute used to sort the column */
  @Input() sortName: string;
  /** Libelle of the header (is template not defined) */
  @Input() libelle: string;

  /** ngIf for column */
  @Input() showIf: boolean;
  /** !ngif for column */
  @Input() hideIf: boolean;

  /** Sort in reserve */
  @Input() inversSort = false;

  /** Is the column sortable */
  @Input() sortable = false;

  /** Autosort this column when you give new data */
  @Input() sortByDefault: boolean;

  /** Add a class to this column */
  @Input() columnClass: any;

  /** The column will be inlined */
  @Input() inlineColumn = false;

  /** Type of the column (checkbox will display checkbox column) */
  @Input() type: 'text' | 'checkbox' = 'text';

  /** If this function is define it's used to define a custom sort on column */
  @Input() customSort: Function;

  /** Event emitted when checkbox is checked */
  @Output() onChecked = new EventEmitter<any>();

  /** Event emitted when the 'allcheckbox' is checked */
  @Output() onAllChecked = new EventEmitter<boolean>();

  asc: boolean = null;

  @ContentChild(AsiComponentTemplateCellDef, {static: false}) cellDef: AsiComponentTemplateCellDef;
  @ContentChild(AsiComponentTemplateTableHeaderDef, {static: false}) headerDef: AsiComponentTemplateTableHeaderDef;

  @ContentChildren(AsiTableInliner) queryColumns: QueryList<AsiTableInliner>;
  inliners: Array<AsiTableInliner> = new Array<AsiTableInliner>();

  constructor() {}

  ngOnInit() {
    this.asc = this.sortByDefault;
  }

  // asc / desc / not sort
  toggleSort(): boolean {
    return this.asc = !this.asc;
  }

  unsort() {
    this.asc = null;
  }

  getAsc() {
    return this.inversSort ? !this.asc : this.asc;
  }

  getSortName() {
    return this.sortName != null ? this.sortName : this.name;
  }

  ngAfterContentInit() {
    this.queryColumns.forEach(inlined => {
      this.inliners.push(inlined)
    });
  }
}
