begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select has_index(
  'public', 'floors', 'floors_id_building_uidx',
  'floors expose a composite identity for building/floor foreign keys'
);
select has_trigger(
  'public', 'location_anchors', 'location_anchor_space_consistency_guard',
  'location anchors validate optional space against building and floor'
);

insert into public.buildings (
  id, name, short_name, publication_status, review_status
) values ('integrity-building', 'Integrity Building', 'IB', 'published', 'verified');
insert into public.floors (id, building_id, level, name, display_order)
values ('integrity-building-gf', 'integrity-building', 1, 'Ground Floor', 1);

select throws_ok(
  $$insert into public.spaces (
      id, building_id, floor_id, name, kind, publication_status, review_status
    ) values (
      'integrity-wrong-floor', 'integrity-building', 'mb-gf',
      'Wrong floor parent', 'classroom', 'published', 'verified'
    )$$,
  '23503', null,
  'space cannot point at a floor owned by another building'
);

select throws_ok(
  $$insert into public.location_anchors (
      id, building_id, floor_id, space_id, graph_node_id, label, qr_slug,
      publication_status, review_status
    ) values (
      'integrity-bad-anchor', 'integrity-building', 'integrity-building-gf', 'mb304',
      'integrity-node-bad', 'Bad anchor', 'integrity-bad-anchor', 'published', 'verified'
    )$$,
  '23514', null,
  'anchor cannot point at a space on another building/floor'
);

select lives_ok(
  $$insert into public.location_anchors (
      id, building_id, floor_id, space_id, graph_node_id, label, qr_slug,
      publication_status, review_status
    ) values (
      'integrity-null-space-anchor', 'integrity-building', 'integrity-building-gf', null,
      'integrity-node-ok', 'Anchor without attached room', 'integrity-null-space-anchor',
      'published', 'verified'
    )$$,
  'anchor may represent a verified hallway/stair location without an attached room'
);

select * from finish();
rollback;
