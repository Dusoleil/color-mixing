import {vec2,vec3,vec4,mat3,mat4,quat} from "glMatrix"

export function point_to_point_distance(p1,p2)
{
    return vec3.distance(p1,p2);
}

export function barycentric_point(p,c)
{
    return [1];
}

export function scalar_project_onto_line(p,l1,l2)
{
    let a = vec3.create();
    vec3.subtract(a,p,l1);
    let b = vec3.create();
    vec3.subtract(b,l2,l1);
    vec3.normalize(b,b);
    let scalar_proj = vec3.dot(a,b);
    return scalar_proj;
}

export function project_onto_line(p,l1,l2)
{
    let b = vec3.create();
    vec3.subtract(b,l2,l1);
    vec3.normalize(b,b);
    let scalar_proj = scalar_project_onto_line(p,l1,l2);
    let proj = vec3.create();
    vec3.scale(proj,b,scalar_proj);
    vec3.add(proj,proj,l1);
    return proj;
}

export function barycentric_line(p,l1,l2)
{
    let scalar = scalar_project_onto_line(p,l1,l2);
    let dist = point_to_point_distance(l1,l2);
    let b1 = scalar / dist;
    let b0 = 1 - b1;
    return [b0,b1];
}

export function barycentric_line_bounded(p,l1,l2)
{
    let bary = barycentric_line(p,l1,l2);
    function clamp(min,val,max)
    {
        return Math.max(min,Math.min(val,max));
    }
    return [clamp(0,bary[0],1),clamp(0,bary[1],1)];
}

export function project_onto_line_segment(p,l1,l2)
{
    let bary = barycentric_line_bounded(p,l1,l2)[0];
    if(bary >= 1) return l1;
    if(bary <= 0) return l2;
    return project_onto_line(p,l1,l2);
}

export function point_to_line_distance(p,l1,l2)
{
    let projection = project_onto_line_segment(p,l1,l2);
    return point_to_point_distance(p,projection);
}

export function get_rotation_from_triangle_to_xy(t1,t2,t3)
{
    let t2_origin = vec3.create();
    let t3_origin = vec3.create();
    vec3.sub(t2_origin,t2,t1);
    vec3.sub(t3_origin,t3,t1);
    let triangle_normal = vec3.create();
    vec3.cross(triangle_normal,t2_origin,t3_origin);
    let target_axis = vec3.fromValues(0,0,1);
    let rotation_axis = vec3.create();
    vec3.cross(rotation_axis,triangle_normal,target_axis);
    vec3.normalize(rotation_axis,rotation_axis);
    let rotation_magnitude = vec3.angle(triangle_normal,target_axis);
    let rotation = quat.create();
    quat.setAxisAngle(rotation,rotation_axis,rotation_magnitude);
    return rotation;
}

export function project_onto_plane(p,t1,t2,t3)
{
    let rotation = get_rotation_from_triangle_to_xy(t1,t2,t3);
    let projection = vec3.create();
    vec3.sub(projection,p,t1);
    vec3.transformQuat(projection,projection,rotation);
    projection[2] = 0;
    quat.invert(rotation,rotation);
    vec3.transformQuat(projection,projection,rotation);
    vec3.add(projection,projection,t1);
    return projection;
}

export function barycentric_triangle(p,t1,t2,t3)
{
    let rotation = get_rotation_from_triangle_to_xy(t1,t2,t3);
    function project_xy(p)
    {
        let projection = vec3.create();
        vec3.transformQuat(projection,p,rotation);
        projection = vec2.fromValues(projection[0],projection[1]);
        return projection;
    }
    let p_2d = project_xy(p);
    let t1_2d = project_xy(t1);
    let t2_2d = project_xy(t2);
    let t3_2d = project_xy(t3);
    let lin_eq_left = mat3.fromValues(t1_2d[0],t1_2d[1],1,t2_2d[0],t2_2d[1],1,t3_2d[0],t3_2d[1],1);
    let lin_eq_right = vec3.fromValues(p_2d[0],p_2d[1],1);
    let inv_left = mat3.create();
    mat3.invert(inv_left,lin_eq_left);
    let solution = vec3.create();
    vec3.transformMat3(solution,lin_eq_right,inv_left);
    return solution;
}

export function barycentric_triangle_bounded(p,t1,t2,t3)
{
    let bary = barycentric_triangle(p,t1,t2,t3);
    if(bary[0] <= 0 || bary[1] <= 0 || bary[2] <= 0)
    {
        let dist_edge1 = point_to_line_distance(p,t1,t2);
        let dist_edge2 = point_to_line_distance(p,t2,t3);
        let dist_edge3 = point_to_line_distance(p,t1,t3);
        let min_dist = Math.min(dist_edge1,Math.min(dist_edge2,dist_edge3));
        if(min_dist == dist_edge1)
        {
            bary = barycentric_line_bounded(p,t1,t2);
            return [bary[0],bary[1],0];
        }
        else if(min_dist == dist_edge2)
        {
            bary = barycentric_line_bounded(p,t2,t3);
            return [0,bary[0],bary[1]];
        }
        else if(min_dist == dist_edge3)
        {
            bary = barycentric_line_bounded(p,t1,t3);
            return [bary[0],0,bary[1]];
        }
    }
    else
        return bary;
}

export function project_onto_triangle(p,t1,t2,t3)
{
    let bary = barycentric_triangle_bounded(p,t1,t2,t3);
    let sw = 0;
    if(bary[0] <= 0) sw += 1;
    if(bary[1] <= 0) sw += 2;
    if(bary[2] <= 0) sw += 4;
    switch(sw)
    {
        case 0:
            return project_onto_plane(p,t1,t2,t3);
        case 1:
            return project_onto_line_segment(p,t2,t3);
        case 2:
            return project_onto_line_segment(p,t1,t3);
        case 3:
            return t3;
        case 4:
            return project_onto_line_segment(p,t1,t2);
        case 5:
            return t2;
        case 6:
            return t1;
    }
}

export function point_to_triangle_distance(p,t1,t2,t3)
{
    let projection = project_onto_triangle(p,t1,t2,t3);
    return point_to_point_distance(p,projection);
}

export function barycentric_tetrahedron(p,t1,t2,t3,t4)
{
    let lin_eq_left = mat4.fromValues(t1[0],t1[1],t1[2],1,t2[0],t2[1],t2[2],1,t3[0],t3[1],t3[2],1,t4[0],t4[1],t4[2],1);
    let lin_eq_right = vec4.fromValues(p[0],p[1],p[2],1);
    let inv_left = mat4.create();
    mat4.invert(inv_left,lin_eq_left);
    let solution = vec4.create();
    vec4.transformMat4(solution,lin_eq_right,inv_left);
    return solution;
}

export function barycentric_tetrahedron_bounded(p,t1,t2,t3,t4)
{
    let bary = barycentric_tetrahedron(p,t1,t2,t3,t4);
    if(bary[0] <= 0 || bary[1] <= 0 || bary[2] <= 0 || bary[3] <= 0)
    {
        let dist_face1 = point_to_triangle_distance(p,t1,t2,t3);
        let dist_face2 = point_to_triangle_distance(p,t1,t2,t4);
        let dist_face3 = point_to_triangle_distance(p,t1,t3,t4);
        let dist_face4 = point_to_triangle_distance(p,t2,t3,t4);
        let min_dist = Math.min(dist_face1,Math.min(dist_face2,Math.min(dist_face3,dist_face4)));
        if(min_dist == dist_face1)
        {
            bary = barycentric_triangle_bounded(p,t1,t2,t3);
            return [bary[0],bary[1],bary[2],0];
        }
        else if(min_dist == dist_face2)
        {
            bary = barycentric_triangle_bounded(p,t1,t2,t4);
            return [bary[0],bary[1],0,bary[2]];
        }
        else if(min_dist == dist_face3)
        {
            bary = barycentric_triangle_bounded(p,t1,t3,t4);
            return [bary[0],0,bary[1],bary[2]];
        }
        else if(min_dist == dist_face4)
        {
            bary = barycentric_triangle_bounded(p,t2,t3,t4);
            return [0,bary[0],bary[1],bary[2]];
        }
    }
    else
        return bary;
}

export function project_onto_tetrahedron(p,t1,t2,t3,t4)
{
    let bary = barycentric_tetrahedron_bounded(p,t1,t2,t3,t4);
    let sw = 0;
    if(bary[0] <= 0) sw += 1;
    if(bary[1] <= 0) sw += 2;
    if(bary[2] <= 0) sw += 4;
    if(bary[3] <= 0) sw += 8;
    switch(sw)
    {
        case 0:
            return p;
        case 1:
            return project_onto_triangle(p,t2,t3,t4);
        case 2:
            return project_onto_triangle(p,t1,t3,t4);
        case 3:
            return project_onto_line_segment(p,t3,t4);
        case 4:
            return project_onto_triangle(p,t1,t2,t4);
        case 5:
            return project_onto_line_segment(p,t2,t4);
        case 6:
            return project_onto_line_segment(p,t1,t3);
        case 7:
            return t4;
        case 8:
            return project_onto_triangle(p,t1,t2,t3);
        case 9:
            return project_onto_line_segment(p,t2,t3);
        case 10:
            return project_onto_line_segment(p,t1,t3);
        case 11:
            return t3;
        case 12:
            return project_onto_line_segment(p,t1,t2);
        case 13:
            return t2;
        case 14:
            return t1;
    }
}

export function point_to_tetrahedron_distance(p,t1,t2,t3,t4)
{
    let projection = project_onto_tetrahedron(p,t1,t2,t3,t4);
    return point_to_point_distance(p,projection);
}

export function angle_between_lines(a1,a2,b1,b2)
{
    let a = vec3.create();
    vec3.subtract(a,a2,a1);
    let b = vec3.create();
    vec3.subtract(b,b2,b1);
    let t = vec3.angle(a,b);
    return t;
}

export function calculate_setpoints(old_sp,current_bary,target_bary)
{
    if(current_bary[0] <= 0 || target_bary[0] <= 0) return target_bary;
    let new_sp = [0];
    for(let i = 1; i < old_sp.length; i++)
    {
        if(target_bary[i] <= 0)
        {
            new_sp.push(0);
            continue;
        }
        if(old_sp[i] <= 0)
        {
            new_sp.push(target_bary[i]);
            continue;
        }
        if(current_bary[i] <= 0)
        {
            new_sp.push(old_sp[i]*2);
            continue;
        }
        let cur_bary_ratio = current_bary[i] / current_bary[0];
        let tar_bary_ratio = target_bary[i] / target_bary[0];
        let mult = tar_bary_ratio / cur_bary_ratio;
        new_sp.push(mult*old_sp[i]);
    }
    return new_sp;
}

export function angle_between_lines_q1(a1,a2,b1,b2)
{
    let t = angle_between_lines(a1,a2,b1,b2);
    if(t>(Math.PI/2))
        t = Math.PI - t;
    return t;
}

export function rad_to_deg(t)
{
    return t * (180/Math.PI);
}